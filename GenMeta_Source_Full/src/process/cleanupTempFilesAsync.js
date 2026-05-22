const fs = require("fs");

/**
 * Asynchronously deletes temporary files, skipping paths that are null,
 * in output directories, or are EPS/SVG preview files.
 *
 * @param {Array<string|null>} tempFiles - Array of file paths to clean up.
 */
function cleanupTempFilesAsync(tempFiles) {
  if (!tempFiles || !tempFiles.length) return;

  // Filter out paths that should not be deleted
  const filesToCleanup = tempFiles.filter(
    (filePath) =>
      filePath &&
      typeof filePath === "string" &&
      !filePath.includes("GenMeta_Result") &&
      !filePath.includes("eps-conversion") && // Preserve EPS preview files
      !filePath.includes("svg-conversion") // Preserve SVG preview files
  );

  if (filesToCleanup.length === 0) return;

  // Delete files in parallel, ignoring individual failures
  Promise.all(
    filesToCleanup.map((filePath) =>
      fs.promises
        .unlink(filePath)
        .catch((err) =>
          console.error(`Failed to delete ${filePath}:`, err)
        )
    )
  ).catch((err) => console.error("Error during cleanup:", err));
}

module.exports = { cleanupTempFilesAsync };
