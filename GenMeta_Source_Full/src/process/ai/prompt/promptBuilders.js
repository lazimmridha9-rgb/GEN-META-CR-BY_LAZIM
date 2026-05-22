const {
  getKeywordInstruction,
  getCategoryInstructions,
  buildOutputFields,
} = require("./sharedUtils");

/**
 * Builds the base prompt template for image metadata generation.
 *
 * @param {string} typeLabel - Human-readable media type (e.g., "JPG image").
 * @param {number} titleLength - Target title length.
 * @param {string} titleLengthMode - "fixed" or "range".
 * @param {number} descriptionLength - Target description length.
 * @param {number} keywordCount - Number of keywords.
 * @param {string} keywordFormat - "single", "double", or "auto".
 * @param {boolean} enableAdobeStock - Include Adobe category selection.
 * @param {boolean} enableShutterstock - Include Shutterstock category selection.
 * @returns {string} The formatted prompt string.
 */
const getBasePrompt = (
  typeLabel,
  titleLength,
  titleLengthMode,
  descriptionLength,
  keywordCount,
  keywordFormat,
  enableAdobeStock,
  enableShutterstock
) => {
  const keywordInstruction = getKeywordInstruction(keywordFormat);
  const { adobe, shutterstock } = getCategoryInstructions(
    enableAdobeStock,
    enableShutterstock,
    typeLabel === "VIDEO"
  );
  const outputFields = buildOutputFields(enableAdobeStock, enableShutterstock);

  const titleConstraint =
    titleLengthMode === "fixed"
      ? `EXACTLY ${titleLength} characters in length`
      : "between 60-140 characters in length";

  return `ROLE:
You are a professional metadata writer for global microstock agencies (Adobe Stock, Shutterstock, iStock).
Your job is to create clear, accurate, and SEO-friendly metadata that complies with contributor rules.

TASK: For each ${typeLabel}, Please generate well-crafted metadata following these requirements:
- Title: ${titleConstraint}, only first word capitalized in a sentence
- Description: approximately ${descriptionLength} characters, combining multiple short descriptive phrases
- Keywords: ${keywordCount} unique, ${keywordInstruction} relevant SEO keywords (don't repeat same phrases/words)${adobe}${shutterstock}

Follow Microstock standards: Style, Subject, Location or Background. STRICT RULE MUST BE FOLLOW: never use special symbols such as ( :, &, |, /, (), ;) in titles and descriptions and Avoid using (a, an, the). Do not include character count annotations or length indicators in your output.

OUTPUT FORMAT STRICTLY:
  [
    {
      ${outputFields}
    }
    ...and so on for EACH file
  ]\n\n`;
};

/**
 * Builds the prompt template specifically for video metadata generation.
 *
 * @param {number} titleLength - Target title length.
 * @param {string} titleLengthMode - "fixed" or "range".
 * @param {number} descriptionLength - Target description length.
 * @param {number} keywordCount - Number of keywords.
 * @param {string} keywordFormat - "single", "double", or "auto".
 * @param {boolean} enableAdobeStock - Include Adobe category selection.
 * @param {boolean} enableShutterstock - Include Shutterstock category selection.
 * @returns {string} The formatted prompt string.
 */
const getVideoPrompt = (
  titleLength,
  titleLengthMode,
  descriptionLength,
  keywordCount,
  keywordFormat,
  enableAdobeStock,
  enableShutterstock
) => {
  const keywordInstruction = getKeywordInstruction(keywordFormat);
  const { adobe, shutterstock } = getCategoryInstructions(
    enableAdobeStock,
    enableShutterstock,
    true
  );
  const outputFields = buildOutputFields(enableAdobeStock, enableShutterstock);

  const titleConstraint =
    titleLengthMode === "fixed"
      ? `EXACTLY ${titleLength} characters in length`
      : "between 60-140 characters in length";

  return `ROLE:
You are a professional metadata writer for global microstock agencies (Adobe Stock, Shutterstock, iStock).

TASK: For this VIDEO file, Please analyze all frames and generate well-crafted metadata following these requirements:
- Title: ${titleConstraint}, only first word capitalized in a sentence
- Description: approximately ${descriptionLength} characters, combining multiple short descriptive phrases
- Keywords: ${keywordCount} unique, ${keywordInstruction} relevant SEO keywords (don't repeat same phrases/words)${adobe}${shutterstock}

Follow Microstock standards. STRICT RULE: never use special symbols such as ( :, &, |, /, (), ;) in titles and descriptions and Avoid using (a, an, the).

OUTPUT FORMAT STRICTLY (single object only):
  {
    ${outputFields}
  }\n\n`;
};

module.exports = { getBasePrompt, getVideoPrompt };
