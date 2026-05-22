const settingsHandler = require('./settings.ipc');
const pathHandler = require('./path.ipc');
const processingHandler = require('./processing.ipc');
const outputHandler = require('./output.ipc');
const exportHandler = require('./export.ipc');
const gsPathHandler = require('./ghostscript.ipc');
const ffmpegHandler = require('./ffmpeg.ipc');
const authHandler = require('./auth.ipc');
const appHandler = require('./app.ipc');
const updateHandler = require('./update.ipc');

module.exports = {
  registerSettingsHandlers: settingsHandler.registerSettingsHandlers,
  registerPathHandler: pathHandler.registerPathHandler,
  registerProcessingHandler: processingHandler.registerProcessingHandler,
  getDeviceId: processingHandler.getDeviceId,
  registerOutputHandler: outputHandler.registerOutputHandler,
  registerExportHandler: exportHandler.registerExportHandler,
  registerGsPathHandlers: gsPathHandler.registerGsPathHandlers,
  registerFFmpegHandlers: ffmpegHandler.registerFFmpegHandlers,
  registerAuthHandlers: authHandler.registerAuthHandlers,
  registerAppHandlers: appHandler.registerAppHandlers,
  registerUpdateHandlers: updateHandler.registerUpdateHandlers,
};
