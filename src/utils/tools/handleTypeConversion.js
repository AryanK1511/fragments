const MarkdownIt = require('markdown-it');

// Handle all the type conversions
module.exports.handleTypeConversion = (currentType, finalType, fragmentData) => {
  switch (finalType) {
    case 'text/plain':
      return fragmentData.toString('utf-8');
    case 'text/html':
      if (currentType === 'text/markdown') {
        const md = new MarkdownIt();
        return md.render(fragmentData.toString('utf-8'));
      } else {
        throw new Error(`Cannot convert ${currentType} to HTML`);
      }
    default:
      throw new Error(
        `Type conversion from ${currentType} to ${finalType} is currently not supported by the API.`
      );
  }
};
