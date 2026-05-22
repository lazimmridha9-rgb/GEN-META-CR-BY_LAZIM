const path = require("path");
const fs = require("fs");

const { sanitizeFilename } = require("./sanitize");

/**
 * Handle batch file renaming from the renderer
 * Supports renaming by title or description with optional index prefix
 * Also renames associated JPG/PNG copies for EPS/SVG files
 * @param {object[]} files - Array of file objects with filePath, filename, title, description
 * @param {string} renameType - "title" or "description"
 * @param {boolean} [prefixIndex=false] - Whether to prepend zero-padded index
 * @returns {Promise<{success: boolean, message: string, renamedFiles: object[], errors: object[]}>}
 */
async function handleRenameFiles(files, renameType, prefixIndex = false) {
  if (!files || !Array.isArray(files) || files.length === 0) {
    return { success: false, message: "No files provided" };
  }

  const results = {
    success: true,
    message: "Files renamed successfully",
    renamedFiles: [],
    errors: [],
  };

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    try {
      if (!file.filePath || !fs.existsSync(file.filePath)) {
        results.errors.push({
          originalPath: file.filePath || "Unknown",
          originalName: file.filename || "Unknown",
          message: "File not found",
        });
        continue;
      }

      // Extract new name from the specified field
      let newName = "";
      if (renameType === "title" && file.title) {
        newName = file.title.trim();
      } else if (renameType === "description" && file.description) {
        newName = file.description.trim();
      }

      if (!newName) {
        results.errors.push({
          originalPath: file.filePath,
          originalName: file.filename || path.basename(file.filePath),
          message: `Missing or empty ${renameType} field`,
        });
        continue;
      }

      newName = sanitizeFilename(newName);
      if (!newName || newName === "renamed_file") {
        results.errors.push({
          originalPath: file.filePath,
          originalName: file.filename || path.basename(file.filePath),
          message: "Generated filename is empty or invalid after sanitization",
        });
        continue;
      }

      // Add zero-padded index prefix if requested
      if (prefixIndex) {
        const index = i + 1;
        newName = `${index.toString().padStart(files.length.toString().length, "0")}_${newName}`;
      }

      const dir = path.dirname(file.filePath);
      const ext = path.extname(file.filePath);
      let newPath = path.join(dir, `${newName}${ext}`);

      // Skip if filename is unchanged
      if (newPath === file.filePath) {
        results.renamedFiles.push({
          originalPath: file.filePath,
          newPath: file.filePath,
          newName: path.basename(file.filePath),
          renamed: false,
          message: "Filename unchanged",
        });
        continue;
      }

      // Handle name collisions by appending counter
      if (fs.existsSync(newPath)) {
        let uniquePath = newPath;
        let counter = 1;
        while (fs.existsSync(uniquePath)) {
          uniquePath = path.join(dir, `${newName}_${counter}${ext}`);
          counter++;
        }
        newPath = uniquePath;
      }

      // Rename the main file
      fs.renameSync(file.filePath, newPath);

      // Also rename associated JPG/PNG copies for EPS/SVG files
      const fileExt = path.extname(file.filePath).toLowerCase();
      if (fileExt === ".eps" || fileExt === ".svg") {
        for (const copyExt of [".jpg", ".png"]) {
          const src = file.filePath.replace(/\.(eps|svg)$/i, copyExt);
          if (fs.existsSync(src)) {
            try {
              fs.renameSync(
                src,
                newPath.replace(/\.(eps|svg)$/i, copyExt),
              );
            } catch (e) {
              console.error(`Error renaming ${copyExt} copy: ${e.message}`);
            }
          }
        }
      }

      results.renamedFiles.push({
        originalPath: file.filePath,
        newPath,
        newName: path.basename(newPath),
        renamed: true,
        message: "File renamed successfully",
      });
    } catch (fileError) {
      results.errors.push({
        originalPath: file.filePath,
        originalName: file.filename || path.basename(file.filePath),
        message: `Error renaming file: ${fileError.message}`,
      });
    }
  }

  // Update overall success status
  if (results.errors.length > 0) {
    results.success = results.renamedFiles.length > 0;
    results.message =
      results.renamedFiles.length > 0
        ? `Renamed ${results.renamedFiles.length} files with ${results.errors.length} errors`
        : "Failed to rename any files";
  }

  return results;
}

module.exports = { handleRenameFiles };
