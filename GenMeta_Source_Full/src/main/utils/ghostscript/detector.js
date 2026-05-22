const fs = require('fs').promises;
const { existsSync } = require('fs');
const path = require('path');
const { execAsync } = require('./execHelper');
const { verifyGhostscriptFunctionality } = require('./verifier');

const PROGRAM_DIRS = ['C:\\Program Files\\gs', 'C:\\Program Files (x86)\\gs'];

/**
 * Finds the Ghostscript executable path on the system
 * @returns {Promise<string>} Path to Ghostscript executable
 */
async function findGhostscriptPath() {
  // Search standard installation directories
  for (const programDir of PROGRAM_DIRS) {
    try {
      if (existsSync(programDir)) {
        const versionDirs = await fs.readdir(programDir);
        const sorted = versionDirs
          .filter((d) => d.startsWith('gs'))
          .sort((a, b) => {
            return b.replace(/^gs/, '').localeCompare(a.replace(/^gs/, ''), undefined, { numeric: true });
          });

        for (const versionDir of sorted) {
          for (const exe of ['gswin64c.exe', 'gswin32c.exe']) {
            const gsPath = path.join(programDir, versionDir, 'bin', exe);
            if (existsSync(gsPath)) return gsPath;
          }
        }
      }
    } catch (e) {
      // Continue to next directory
    }
  }

  // Fall back to PATH search
  for (const exe of ['gswin64c', 'gswin32c', 'gs']) {
    try {
      const { stdout } = await execAsync(`where ${exe}`, 10000);
      return stdout.trim().split('\n')[0];
    } catch (e) {
      // Continue to next executable
    }
  }

  throw new Error('Ghostscript not found. Please install Ghostscript to process EPS files.');
}

/**
 * Checks if Ghostscript is installed and functional
 * @returns {Promise<Object>} Installation status with details
 */
async function isGhostscriptInstalled() {
  try {
    const gsPath = await findGhostscriptPath();

    try {
      const { stdout } = await execAsync(`"${gsPath}" --version`, 10000);
      const version = stdout.trim();
      const funcTest = await verifyGhostscriptFunctionality(gsPath);

      if (!funcTest.success) {
        return {
          installed: true,
          path: gsPath,
          version,
          functional: false,
          warning: 'May not be functioning correctly',
          testError: funcTest.error,
        };
      }

      const versionNumber = parseFloat(version);
      return {
        installed: true,
        path: gsPath,
        version,
        functional: true,
        versionValid: !isNaN(versionNumber) && versionNumber >= 9.5,
      };
    } catch (versionError) {
      return {
        installed: true,
        path: gsPath,
        version: 'Unknown',
        functional: false,
        warning: 'Could not retrieve version',
        error: versionError.message,
      };
    }
  } catch (error) {
    return { installed: false, error: error.message };
  }
}

module.exports = { findGhostscriptPath, isGhostscriptInstalled };
