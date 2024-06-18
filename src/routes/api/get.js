const logger = require('../../logger');
const { Fragment } = require('../../model/fragment');
const { createSuccessResponse, createErrorResponse } = require('../../response');
const { TYPES_MAPPING } = require('../../utils/mappings');

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
    logger.error(
      { err: error },
      'An error occurred while fetching a fragment metdata by ID for a user'
    );
    res.status(500).send(createErrorResponse(500, error.message));
  }
};

module.exports.getFragmentById = async (req, res) => {
  const [fragmentId, extension] = req.params.id.split('.');

  logger.info('Request to get fragment by ID for user');

  try {
    logger.info('Fetching fragment by ID for user');
    const requestedFragment = await Fragment.byId(req.user, fragmentId);

    const fragment = new Fragment(requestedFragment);

    logger.info('Fetching the data of a fragment for user');
    let fragmentData = await fragment.getData();

    if (extension) {
      logger.info({ extension }, 'Extension provided, checking for possible conversion');

      if (fragment.formats.includes(TYPES_MAPPING[`.${extension}`])) {
        logger.info('Type conversion possible');

        // TODO: Code to convert into the desired type
        // For now, we just return txt
        logger.info('Fragment data converted successfully');
        res.status(200).send(fragmentData.toString('utf-8'));
      } else {
        logger.error(
          { mimeType: fragment.mimeType, formats: fragment.formats },
          'Type conversion not possible'
        );

        res
          .status(415)
          .send(
            createErrorResponse(
              415,
              `Type conversion not possible. ${fragment.mimeType} can only be converted into ${fragment.formats}.`
            )
          );
      }
    } else {
      logger.info('No extension provided, returning data in original format');
      // Return txt for now
      res.status(200).send(fragmentData.toString('utf-8'));
    }
  } catch (error) {
    logger.error({ err: error }, 'An error occurred while fetching a fragment by ID for a user');
    res.status(500).send(createErrorResponse(500, error.message));
  }
};
