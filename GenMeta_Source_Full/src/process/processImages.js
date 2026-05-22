const fs = require("fs");
const path = require("os");
const os = require("os");

const {
  processBatchWithConcurrencyLimit,
} = require("./processBatchWithConcurrencyLimit");

/**
 * Returns the path to the results directory in the system temp folder.
 * Creates the directory if it does not exist.
 *
 * @returns {string} The results directory path.
 */
function getResultsDir() {
  const tempDir = os.tmpdir();
  const resultsDir = path.join(tempDir, "genmeta-results");

  if (!fs.existsSync(resultsDir)) {
    try {
      fs.mkdirSync(resultsDir, { recursive: true });
    } catch (err) {
      console.error(`Failed to create results directory: ${err.message}`);
    }
  }

  return resultsDir;
}

/**
 * Generates a results file path based on the output directory name.
 *
 * @param {string} outputDir - The output directory path.
 * @returns {string} The full path to the results JSON file.
 */
function getResultsFilePath(outputDir) {
  const outputDirName = path.basename(outputDir);
  return path.join(getResultsDir(), `${outputDirName}-results.json`);
}

/**
 * Processes all media files in a directory (or a selected subset) with
 * concurrency-limited batching, retry support, and result persistence.
 *
 * @param {string} parentDir - The directory containing media files.
 * @param {Object} options - Processing options (may include outputDirectory for retry mode).
 * @param {Array<string>} apiKeys - Array of API keys for rotation.
 * @param {Array<Object>|null} [selectedFiles=null] - Optional specific files to process.
 * @param {string|null} [gsPath=null] - Ghostscript executable path.
 * @returns {Promise<Object>} Object with total, successful, failed, cancelled, allResults, and outputDirectory.
 */
async function processImages(
  parentDir,
  options,
  apiKeys,
  selectedFiles = null,
  gsPath = null
) {
  let outputDir;

  // Detect retry mode: an explicit output directory was provided
  const isRetryMode =
    options.outputDirectory && typeof options.outputDirectory === "string";

  // Store existing successful results for retry mode
  let existingSuccessfulResults = [];

  if (isRetryMode) {
    // For retry operations, use the exact output directory path provided
    outputDir = options.outputDirectory;

    // Load previous results if available
    const resultsFilePath = getResultsFilePath(outputDir);
    if (fs.existsSync(resultsFilePath)) {
      try {
        const existingResults = JSON.parse(
          fs.readFileSync(resultsFilePath, "utf8")
        );
        if (
          existingResults &&
          existingResults.allResults &&
          Array.isArray(existingResults.allResults)
        ) {
          existingSuccessfulResults = existingResults.allResults.filter(
            (result) => !result.error && result.status !== "cancelled"
          );
        }
      } catch (err) {
        console.error(`Error reading existing results: ${err.message}`);
      }
    }
  } else {
    // Create a new timestamped output directory
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    outputDir = path.join(parentDir, `GenMeta_Result_${timestamp}`);
  }

  // Check if processing is already stopped
  if (global.processingState && global.processingState.isProcessingStopped) {
    console.warn("Processing already stopped before starting");
    return {
      total: 0,
      successful: [],
      failed: [],
      cancelled: [],
      allResults: [],
      outputDirectory: outputDir,
      status: "cancelled",
    };
  }

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Build the list of media files to process
  let mediaFiles;
  if (selectedFiles && Array.isArray(selectedFiles)) {
    // Use the explicitly selected files
    mediaFiles = selectedFiles.map((file) => ({
      filename: file.filename,
      path: file.path,
      outputPath: path.join(outputDir, file.filename),
    }));
  } else {
    // Scan the directory for supported media formats
    mediaFiles = fs
      .readdirSync(parentDir)
      .filter(
        (file) =>
          file.toLowerCase().endsWith(".jpg") ||
          file.toLowerCase().endsWith(".png") ||
          file.toLowerCase().endsWith(".jpeg") ||
          file.toLowerCase().endsWith(".eps") ||
          file.toLowerCase().endsWith(".svg") ||
          file.toLowerCase().endsWith(".mp4") ||
          file.toLowerCase().endsWith(".mov")
      )
      .map((file) => ({
        filename: file,
        path: path.join(parentDir, file),
        outputPath: path.join(outputDir, file),
      }));
  }

  // Notify about batch start
  if (global.progressEvents?.onBatchStart) {
    global.progressEvents.onBatchStart(mediaFiles.length);
  }

  try {
    // Progress tracking callback
    const onImageProcessed = () => {
      if (global.progressEvents?.onImageProcessed) {
        global.progressEvents.onImageProcessed();
      }
    };

    const processResults = await processBatchWithConcurrencyLimit(
      mediaFiles,
      {
        outputDir,
        onImageProcessed,
        createJpgCopy: options.createJpgCopy || false,
        createPngCopy: options.createPngCopy || false,
        ...options,
      },
      apiKeys,
      gsPath
    );

    // Check if processing was stopped during batch processing
    if (global.processingState && global.processingState.isProcessingStopped) {
      // Notify frontend
      if (global.mainWindow && !global.mainWindow.isDestroyed()) {
        global.mainWindow.webContents.send("processing-stopped", {
          message: "Processing has been stopped by user request",
        });
      }

      // Mark unprocessed items as cancelled
      const allResults = processResults.map((result) => {
        if (!result.status || result.status === "processing") {
          return {
            ...result,
            error: "Processing was stopped by user request",
            status: "cancelled",
          };
        }
        return result;
      });

      const successfulResults = allResults.filter(
        (result) => !result.error && result.status !== "cancelled"
      );
      const failedResults = allResults.filter(
        (result) => result.error && result.status !== "cancelled"
      );
      const cancelledResults = allResults.filter(
        (result) => result.status === "cancelled"
      );

      // Merge with existing results in retry mode
      const combinedSuccessfulResults = isRetryMode
        ? [...existingSuccessfulResults, ...successfulResults]
        : successfulResults;

      const combinedAllResults = isRetryMode
        ? [
            ...existingSuccessfulResults,
            ...failedResults,
            ...cancelledResults,
          ]
        : [...successfulResults, ...failedResults, ...cancelledResults];

      // Persist results for future retries
      try {
        fs.writeFileSync(
          getResultsFilePath(outputDir),
          JSON.stringify(
            {
              total: mediaFiles.length + existingSuccessfulResults.length,
              successful: combinedSuccessfulResults,
              failed: failedResults,
              cancelled: cancelledResults,
              allResults: combinedAllResults,
              outputDirectory: outputDir,
              status: "cancelled",
            },
            null,
            2
          )
        );
      } catch (err) {
        console.error(`Error saving results: ${err.message}`);
      }

      return {
        total: mediaFiles.length + existingSuccessfulResults.length,
        successful: combinedSuccessfulResults,
        failed: failedResults,
        cancelled: cancelledResults,
        allResults: combinedAllResults,
        outputDirectory: outputDir,
        status: "cancelled",
      };
    }

    // Separate successful and failed results
    const successfulResults = processResults.filter((result) => !result.error);
    const failedResults = processResults.filter((result) => result.error);

    // Merge with existing results in retry mode
    const combinedSuccessfulResults = isRetryMode
      ? [...existingSuccessfulResults, ...successfulResults]
      : successfulResults;

    const combinedAllResults = isRetryMode
      ? [...existingSuccessfulResults, ...successfulResults, ...failedResults]
      : [...successfulResults, ...failedResults];

    // Persist results for future retries
    try {
      fs.writeFileSync(
        getResultsFilePath(outputDir),
        JSON.stringify(
          {
            total: mediaFiles.length + existingSuccessfulResults.length,
            successful: combinedSuccessfulResults,
            failed: failedResults,
            allResults: combinedAllResults,
            outputDirectory: outputDir,
          },
          null,
          2
        )
      );
    } catch (err) {
      console.error(`Error saving results: ${err.message}`);
    }

    return {
      total: mediaFiles.length + existingSuccessfulResults.length,
      successful: combinedSuccessfulResults,
      failed: failedResults,
      allResults: combinedAllResults,
      outputDirectory: outputDir,
    };
  } catch (error) {
    console.error(`Error in background processing for batch:`, error);
    throw error;
  }
}

module.exports = {
  processImages,
};
