const MarkdownIt = require('markdown-it');

// Handle all the type conversions
module.exports.handleTypeConversion = ({ currentType, finalType, fragmentData }) => {
  switch (finalType) {
    case 'text/plain':
      return convertTxtPlain(fragmentData);
    case 'text/html':
      return convertHTML(currentType, fragmentData);
    default:
      throw new Error(
        `Type conversion from ${currentType} to ${finalType} is currently not supported by the API.`
      );
  }
};

// --- Convert Text Fragments ---
const convertTxtPlain = (fragmentData) => {
  return fragmentData.toString();
};

// --- Convert HTML Fragments ---
const convertHTML = (currentType, fragmentData) => {
  const md = new MarkdownIt();

  switch (currentType) {
    case 'text/markdown':
      return md.render(fragmentData.toString());
    default:
  }
};
