const settingsHandler = require('./settingsHandler');
const pathHandler = require('./pathHandler');
const processingHandler = require('./processingHandler');
const outputHandler = require('./outputHandler');
const exportHandler = require('./exportHandler');
const gsPathHandler = require('./gsPathHandler');
const ffmpegHandler = require('./ffmpegHandler');
const authHandler = require('./authHandler');
const appHandler = require('./appHandler');
const updateHandler = require('./updateHandler');

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
