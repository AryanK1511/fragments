const logger = require('../../logger');

// Checks to see whether the fragment Data and the fragment Type match
module.exports.validateFragment = (fragmentData, fragmentType) => {
  switch (fragmentType) {
    case 'application/json':
      // Throw an error if the program is unable to parse the JSON
      try {
        JSON.parse(fragmentData);
      } catch (error) {
        logger.error(`Invalid JSON data, ${error.message}`);
        throw new Error(`Invalid JSON data, ${error.message}`);
      }
      break;
  }
};
