// Node modules
const path = require("path");
const fs = require("fs");
const { app } = require("electron");

/**
 * Premium plan configuration constant.
 */
const PREMIUM_PLAN = {
  type: "Premium",
  id: null,
};

/**
 * Default premium status object with unlimited credits.
 */
const PREMIUM_STATUS = {
  plan: "Premium",
  credits: Infinity,
  totalCredits: Infinity,
  hasAiApiKey: false,
  aiApiKey: null,
  expiresIn: null,
  expiresAt: null,
  isAiApiKeyManaged: false,
};

/**
 * Normalizes plan data from the API into a consistent format.
 *
 * @param {Object} [planData] - Raw plan data from the API.
 * @returns {Object} Normalized plan data with all expected fields.
 */
function normalizePlanData(planData) {
  if (!planData || typeof planData !== "object") {
    return { ...PREMIUM_STATUS, plan: PREMIUM_PLAN };
  }

  return {
    status: planData.status || "active",
    planType: "Premium",
    planId: planData.plan?.id || null,
    username: planData.username || planData.user?.name || "User",
    expiresIn: null,
    expiresAt: null,
    credit: null,
    credits: Infinity,
    totalCredits: Infinity,
    email: planData.user?.email || null,
    name: planData.user?.name || planData.username || "User",
    aiApiKey: null,
    hasAiApiKey: false,
    isUnlimited: true,
  };
}

/**
 * Returns true indicating the user has unlimited credits.
 *
 * @returns {boolean} Always true for premium users.
 */
function hasUnlimitedCredits() {
  return true;
}

/**
 * Returns true indicating the user is on the premium plan.
 *
 * @returns {boolean} Always true for premium users.
 */
function isPremiumPlan() {
  return true;
}

/**
 * Returns the credit display string for premium users.
 *
 * @returns {string} "Unlimited"
 */
function getCreditDisplay() {
  return "Unlimited";
}

module.exports = {
  PREMIUM_PLAN,
  PREMIUM_STATUS,
  normalizePlanData,
  hasUnlimitedCredits,
  isPremiumPlan,
  getCreditDisplay,
};
