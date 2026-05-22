const path = require('path');
const fs = require('fs');
const { app } = require('electron');

const PREMIUM_PLAN = {
  type: 'Premium',
  id: null,
};

const PREMIUM_STATUS = {
  plan: 'Premium',
  credits: Infinity,
  totalCredits: Infinity,
  hasAiApiKey: false,
  aiApiKey: null,
  expiresIn: null,
  expiresAt: null,
  isAiApiKeyManaged: false,
};

/**
 * Normalizes plan data into a consistent format
 * @param {Object} planData - Raw plan data from API
 * @returns {Object} Normalized plan data
 */
function normalizePlanData(planData) {
  if (!planData || typeof planData !== 'object') {
    return { ...PREMIUM_STATUS, plan: PREMIUM_PLAN };
  }

  return {
    status: planData.status || 'active',
    planType: 'Premium',
    planId: planData.plan?.id || null,
    username: planData.username || planData.user?.name || 'User',
    expiresIn: null,
    expiresAt: null,
    credit: null,
    credits: Infinity,
    totalCredits: Infinity,
    email: planData.user?.email || null,
    name: planData.user?.name || planData.username || 'User',
    aiApiKey: null,
    hasAiApiKey: false,
    isUnlimited: true,
  };
}

/**
 * @returns {boolean} Always true for premium plan
 */
function hasUnlimitedCredits() {
  return true;
}

/**
 * @returns {boolean} Always true - this is a premium-only application
 */
function isPremiumPlan() {
  return true;
}

/**
 * @returns {string} Credit display string
 */
function getCreditDisplay() {
  return 'Unlimited';
}

module.exports = {
  PREMIUM_PLAN,
  PREMIUM_STATUS,
  normalizePlanData,
  hasUnlimitedCredits,
  isPremiumPlan,
  getCreditDisplay,
};
