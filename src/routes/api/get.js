const logger = require('../../logger');
const { Fragment } = require('../../model/fragment');
const { createSuccessResponse, createErrorResponse } = require('../../response');
const { TYPES_MAPPING } = require('../../utils/mappings');

// ===== Get a list of fragments for the current user =====
module.exports.getFragmentsList = async (req, res) => {
  try {
    logger.info('Fetching all the fragments for a user');

    // Fetch the expanded list of objects if the user opts for it
    if (req.query.expand === '1') {
      const fragments = await Fragment.byUser(req.user, true);
      logger.info('Fragments fetched successfully');
      res.status(200).send(
        createSuccessResponse({
          fragments: fragments,
        })
      );
    } else {
      // Otherwise, send the array of fragment IDs to the user
      const fragments = await Fragment.byUser(req.user, false);
      res.status(200).send(
        createSuccessResponse({
          fragments: fragments,
        })
      );
    }
  } catch (error) {
    // Catch any errors that occur during the fragment fetching process
    logger.error('An error occurred while fetching the list of framents for a user:', error);
    res.status(500).send(createErrorResponse(500, 'Internal Server Error'));
  }
};

// ===== Get a single fragment by the fragment ID =====
module.exports.getFragmentById = async (req, res) => {
  // Get the ID and optional extension of the fragment requested from the request
  const [fragmentId, extension] = req.params.id.split('.');

  try {
    logger.info('Fetching fragment by ID for a user');
    const requestedFragment = await Fragment.byId(req.user, fragmentId);

    // Create a fragment with the returned data to get access to the properties and methods of the Fragment class
    const fragment = new Fragment(requestedFragment);
    let fragmentData = await fragment.getData();

    // Check if an extension was provided
    if (extension) {
      // Check to see if the conversion is possible
      if (fragment.formats.includes(TYPES_MAPPING[`.${extension}`])) {
        // TODO: Code to convert into type

        // We return text for now
        res.status(200).send(fragmentData.toString('utf-8'));
      } else {
        logger.error(
          `Type conversion not possible. ${fragment.mimeType} can only be converted into ${fragment.formats}.`
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
      // If no conversion is needed, return in the format at creation
      // We return text for now
      res.status(200).send(fragmentData.toString('utf-8'));
    }
  } catch (error) {
    // Catch any errors that occur during the fragment fetching process
    logger.error('An error occurred while fetching a fragment by ID for a user:', error.message);
    res.status(500).send(createErrorResponse(500, error.message));
  }
};
