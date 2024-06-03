const logger = require('../../logger');
const { Fragment } = require('../../model/fragment');
const { createSuccessResponse, createErrorResponse } = require('../../response');

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
