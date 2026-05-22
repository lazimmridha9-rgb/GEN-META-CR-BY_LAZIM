const { execAsync } = require('./execHelper');

/**
 * Verifies Ghostscript can process a basic command
 * @param {string} gsPath - Path to Ghostscript executable
 * @returns {Promise<Object>} Test result with success status
 */
async function verifyGhostscriptFunctionality(gsPath) {
  try {
    const testCommand = `"${gsPath}" -q -dNOPAUSE -dBATCH -sOutputFile=- -sDEVICE=txtwrite -c "[(Hello) (World)] { =string } forall"`;
    const { stdout, stderr } = await execAsync(testCommand, 10000);
    const success = stdout.includes('Hello') && stdout.includes('World');
    return { success, output: stdout, error: stderr || null };
  } catch (error) {
    return { success: false, output: '', error: error.message };
  }
}

module.exports = { verifyGhostscriptFunctionality };
