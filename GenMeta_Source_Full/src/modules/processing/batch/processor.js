const fs = require("fs");
const path = require("path");
const os = require("os");

const { processBatchWithConcurrencyLimit } = require("./concurrency");

/**
 * Get the temp directory for storing processing results
 * @returns {string} Results directory path
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
 * Generate a results file path based on the output directory name
 * @param {string} outputDir - Output directory path
 * @returns {string} Results JSON file path
 */
function getResultsFilePath(outputDir) {
  const outputDirName = path.basename(outputDir);
  return path.join(getResultsDir(), `${outputDirName}-results.json`);
}

/**
 * Process all images/videos in a directory with concurrency control
 * @param {string} parentDir - Parent directory containing media files
 * @param {object} options - Processing options
 * @param {string[]} apiKeys - Array of API keys for parallel processing
 * @param {object[]|null} [selectedFiles=null] - Specific files to process
 * @param {string|null} [gsPath=null] - Ghostscript path
 * @returns {Promise<{total: number, successful: object[], failed: object[], allResults: object[], outputDirectory: string}>}
 */
async function processImages(
  parentDir,
  options,
  apiKeys,
  selectedFiles = null,
  gsPath = null,
) {
  // Determine output directory
  const isRetryMode =
    options.outputDirectory && typeof options.outputDirectory === "string";
  let outputDir;
  let existingSuccessfulResults = [];

  if (isRetryMode) {
    outputDir = options.outputDirectory;

    // Load existing successful results for retry mode
    const resultsFilePath = getResultsFilePath(outputDir);
    if (fs.existsSync(resultsFilePath)) {
      try {
        const existingResults = JSON.parse(
          fs.readFileSync(resultsFilePath, "utf8"),
        );
        if (
          existingResults &&
          existingResults.allResults &&
          Array.isArray(existingResults.allResults)
        ) {
          existingSuccessfulResults = existingResults.allResults.filter(
            (result) => !result.error && result.status !== "cancelled",
          );
        }
      } catch (err) {
        console.error(`Error reading existing results: ${err.message}`);
      }
    }
  } else {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    outputDir = path.join(parentDir, `GenMeta_Result_${timestamp}`);
  }

  // Check if processing was already stopped
  if (
    global.processingState &&
    global.processingState.isProcessingStopped
  ) {
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

  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Collect media files
  let mediaFiles;
  if (selectedFiles && Array.isArray(selectedFiles)) {
    mediaFiles = selectedFiles.map((file) => ({
      filename: file.filename,
      path: file.path,
      outputPath: path.join(outputDir, file.filename),
    }));
  } else {
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
          file.toLowerCase().endsWith(".mov"),
      )
      .map((file) => ({
        filename: file,
        path: path.join(parentDir, file),
        outputPath: path.join(outputDir, file),
      }));
  }

  // Notify renderer about batch start
  if (global.progressEvents?.onBatchStart) {
    global.progressEvents.onBatchStart(mediaFiles.length);
  }

  try {
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
      gsPath,
    );

    // Check if processing was stopped during processing
    if (
      global.processingState &&
      global.processingState.isProcessingStopped
    ) {
      if (global.mainWindow && !global.mainWindow.isDestroyed()) {
        global.mainWindow.webContents.send("processing-stopped", {
          message: "Processing has been stopped by user request",
        });
      }

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
        (result) => !result.error && result.status !== "cancelled",
      );
      const failedResults = allResults.filter(
        (result) => result.error && result.status !== "cancelled",
      );
      const cancelledResults = allResults.filter(
        (result) => result.status === "cancelled",
      );

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

      // Save results for future retries
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
            2,
          ),
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

    // Normal completion
    const successfulResults = processResults.filter(
      (result) => !result.error,
    );
    const failedResults = processResults.filter((result) => result.error);

    const combinedSuccessfulResults = isRetryMode
      ? [...existingSuccessfulResults, ...successfulResults]
      : successfulResults;
    const combinedAllResults = isRetryMode
      ? [...existingSuccessfulResults, ...successfulResults, ...failedResults]
      : [...successfulResults, ...failedResults];

    // Save results for future retries
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
          2,
        ),
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

module.exports = { processImages };
