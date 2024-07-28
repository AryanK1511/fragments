const logger = require('../../logger');
const { Fragment } = require('../../model/fragment');
const { createSuccessResponse, createErrorResponse } = require('../../response');
const { TYPES_MAPPING } = require('../../utils/types/mapping');
const { handleTypeConversion } = require('../../utils/types/conversions');

// ===== Get a list of fragments for the current user =====
module.exports.getFragmentsList = async (req, res) => {
  try {
    // Fetch the expanded list of objects if the user opts for it
    if (req.query.expand === '1') {
      logger.info('Fetching all the expanded fragments for user');
      const fragments = await Fragment.byUser(req.user, true);
      logger.info('List of expanded fragments fetched successfully');

      res.status(200).send(
        createSuccessResponse({
          fragments: fragments,
        })
      );
    } else {
      logger.info('Fetching list of fragment IDs for user');
      // Otherwise, send the array of fragment IDs to the user
      const fragments = await Fragment.byUser(req.user, false);
      logger.info('List of fragment IDs fetched successfully');

      res.status(200).send(
        createSuccessResponse({
          fragments: fragments,
        })
      );
    }
  } catch (error) {
    // Catch any errors that occur during the fragment fetching process
    logger.error('An error occurred while fetching the list of fragments for user:', error.message);
    res.status(500).send(createErrorResponse(500, 'Internal Server Error'));
  }
};

// ===== Get a specific fragment data by ID for the current user =====
module.exports.getFragmentById = async (req, res) => {
  const [fragmentId, extension] = req.params.id.split('.');
  logger.info('Request to get fragment by ID for user');

  try {
    const requestedFragment = await Fragment.byId(req.user, fragmentId);

    const fragment = new Fragment(requestedFragment);
    const fragmentData = await fragment.getData();

    // Check if an extension exits
    const finalType = TYPES_MAPPING[`.${extension}`];

    // If no extension is provided by the user or the extension is the same as the fragment, the original fragment is returned
    if (!extension || finalType === fragment.mimeType) {
      logger.info('Returning data in original format');
      res.setHeader('Content-Type', fragment.type);
      return res.status(200).send(fragmentData);
    }

    // Convert the data if the data is convertible
    if (fragment.formats.includes(finalType)) {
      logger.info('Type conversion possible. Converting the data.');
      const data = await handleTypeConversion({
        currentType: fragment.mimeType,
        finalType: finalType,
        fragmentData: fragmentData,
      });
      res.setHeader('Content-Type', finalType);
      return res.status(200).send(data);
    }

    // Throw an error if the type conversion is not possible
    logger.error('Type conversion not possible', {
      mimeType: fragment.mimeType,
      formats: fragment.formats,
    });
    return res
      .status(415)
      .send(
        createErrorResponse(
          415,
          `Type conversion not possible. ${fragment.mimeType} can only be converted into ${fragment.formats}.`
        )
      );
  } catch (error) {
    // Throw an error if the requested fragment does not exist
    if (error.message === 'Fragment does not exist') {
      logger.error('Fragment does not exist', { userId: req.user.id, fragmentId });
      return res
        .status(404)
        .send(createErrorResponse(404, "The requested fragment doesn't exist."));
    }
    logger.error('Error fetching fragment by ID for user:', error.message);
    res.status(500).send(createErrorResponse(500, error.message));
  }
};

// ===== Get a specific fragment metadata by ID for the current user =====
module.exports.getFragmentInfoById = async (req, res) => {
  const fragmentId = req.params.id;

  logger.info('Request to get fragment metadata by ID for user');

  try {
    logger.info('Fetching fragment metadata by ID for user');
    const requestFragmentMetadata = await Fragment.byId(req.user, fragmentId);
    res.status(200).send(
      createSuccessResponse({
        fragment: requestFragmentMetadata,
      })
    );
  } catch (error) {
    // Throw an error if the requested fragment does not exist
    if (error.message === 'Fragment does not exist') {
      logger.error('Fragment does not exist', { userId: req.user.id, fragmentId });
      return res
        .status(404)
        .send(createErrorResponse(404, "The requested fragment doesn't exist."));
    }
    logger.error(
      { err: error },
      'An error occurred while fetching a fragment metadata by ID for a user'
    );
    res.status(500).send(createErrorResponse(500, error.message));
  }
};
