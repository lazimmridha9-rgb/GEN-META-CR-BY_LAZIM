const { convertEpsToPng, convertEpsToJpg } = require("./eps-converter");
const { convertSvgToPng } = require("./svg-converter");
const { createTempImages, resizeImage } = require("./resizer");
const {
  downloadBackgroundImage,
  getBackgroundImage,
  preloadBackgroundImage,
} = require("./background");

module.exports = {
  convertEpsToJpg,
  convertEpsToPng,
  convertSvgToPng,
  createTempImages,
  downloadBackgroundImage,
  getBackgroundImage,
  preloadBackgroundImage,
  resizeImage,
};
