const FORBIDDEN_KEYWORDS = ["god", "devil", "movie", "club", "bar"];

const ADOBE_CATEGORIES = [
  { index: 1, name: "Animals" },
  { index: 2, name: "Buildings and Architecture" },
  { index: 3, name: "Business" },
  { index: 4, name: "Drinks" },
  { index: 5, name: "The Environment" },
  { index: 6, name: "States of Mind" },
  { index: 7, name: "Food" },
  { index: 8, name: "Graphic Resources" },
  { index: 9, name: "Hobbies and Leisure" },
  { index: 10, name: "Industry" },
  { index: 11, name: "Landscapes" },
  { index: 12, name: "Lifestyle" },
  { index: 13, name: "People" },
  { index: 14, name: "Plants and Flowers" },
  { index: 15, name: "Culture and Religion" },
  { index: 16, name: "Science" },
];

const SHUTTERSTOCK_CATEGORIES_IMAGE = [
  "Abstract",
  "Animals/Wildlife",
  "Arts",
  "Backgrounds/Textures",
  "Beauty/Fashion",
  "Buildings/Landmarks",
  "Business/Finance",
  "Celebrities",
  "Education",
  "Food and drink",
  "Healthcare/Medical",
  "Holidays",
  "Industrial",
  "Interiors",
  "Miscellaneous",
  "Nature",
  "Objects",
  "Parks/Outdoor",
  "People",
  "Religion",
  "Science",
  "Signs/Symbols",
  "Sports/Recreation",
  "Technology",
  "Transportation",
  "Vintage",
];

const SHUTTERSTOCK_CATEGORIES_VIDEO = [
  "Animals/Wildlife",
  "Arts",
  "Backgrounds/Textures",
  "Buildings/Landmarks",
  "Business/Finance",
  "Education",
  "Food and drink",
  "Healthcare/Medical",
  "Holidays",
  "Industrial",
  "Nature",
  "Objects",
  "People",
  "Religion",
  "Science",
  "Signs/Symbols",
  "Sports/Recreation",
  "Technology",
  "Transportation",
];

/**
 * Finds the 1-based index of a category name in the appropriate category list.
 *
 * @param {string} categoryName - The category name to look up.
 * @param {boolean} [isVideo=false] - Whether to search video categories.
 * @returns {number|null} The 1-based index, or null if not found.
 */
const getCategoryIndex = (categoryName, isVideo = false) => {
  const categoryList = isVideo
    ? SHUTTERSTOCK_CATEGORIES_VIDEO
    : SHUTTERSTOCK_CATEGORIES_IMAGE;
  const index = categoryList.findIndex(
    (cat) => cat.toLowerCase() === categoryName.toLowerCase()
  );
  return index !== -1 ? index + 1 : null;
};

module.exports = {
  FORBIDDEN_KEYWORDS,
  ADOBE_CATEGORIES,
  SHUTTERSTOCK_CATEGORIES_IMAGE,
  SHUTTERSTOCK_CATEGORIES_VIDEO,
  getCategoryIndex,
};
