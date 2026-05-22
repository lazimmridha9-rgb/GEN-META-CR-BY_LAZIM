const path = require("path");
const fs = require("fs");

const { loadSettings } = require("../settings");
const { validateUserID } = require("./user-validator");
const { getProcessingApiKey } = require("./key-manager");
const { logError } = require("./progress");
const { isGuestLoggedIn } = require("../../services/guestAuthService");

/**
 * Handle metadata regeneration for a single file
 * @param {string} filePath - Path to the file to regenerate
 * @param {string} [customPrompt=""] - Optional custom prompt override
 * @returns {Promise<{success: boolean, metadata?: object}>}
 */
async function handleRegenerateMetadata(filePath, customPrompt = "") {
  if (!filePath || !fs.existsSync(filePath)) {
    return { success: false, error: "File not found" };
  }

  const settings = loadSettings();

  if (
    !settings.apiKey &&
    (!settings.aiApiKey || !settings.isAiApiKeyManaged)
  ) {
    throw new Error(
      "API key is not set. Please configure it in settings.",
    );
  }

  // Validate user session (regular or guest)
  const isGuest = isGuestLoggedIn();
  if (!settings.secretKey && !isGuest) {
    throw new Error("You are not logged in.");
  }
  // Skip API validation for guest users
  if (!isGuest) {
    const validation = await validateUserID(settings.secretKey, 1);
    if (!validation || !validation.username || !validation.plan) {
      throw new Error("Invalid API response. Please try again.");
    }
  }

  const processingApiKey = await getProcessingApiKey(settings);
  const { processSingleFile } = require("./single");

  const geminiModel = settings?.geminiModel || "gemini-2.5-flash";

  const options = {
    titleLength: settings.titleLength,
    descriptionLength: settings.descriptionLength,
    keywordCount: settings.keywordCount,
    addPeriodTitle:
      settings.addPeriodTitle !== undefined ? settings.addPeriodTitle : true,
    addPeriodDescription:
      settings.addPeriodDescription !== undefined
        ? settings.addPeriodDescription
        : true,
    positiveKeywords: settings.positiveKeywords || [],
    negativeKeywords: settings.negativeKeywords || "",
    singleKeywordMode: settings.singleKeywordMode || false,
    geminiModel,
    planType: "Premium",
    enableCustomPrompt: settings.enableCustomPrompt || false,
    customPrompt: settings.customPrompt || "",
    additionalPromptText: customPrompt,
  };

  const result = await processSingleFile(
    filePath,
    options,
    processingApiKey,
    settings.gsPath,
    true,
  );

  if (result.status === "failed") {
    throw new Error(result.error || "Failed to process file");
  }

  return { success: true, metadata: result.metadata };
}

module.exports = { handleRegenerateMetadata };
