const logger = require('../../logger');
const { Fragment } = require('../../model/fragment');
const { createSuccessResponse, createErrorResponse } = require('../../response');

// ===== Delete a fragment and its metadata =====
module.exports.deleteFragment = async (req, res) => {
  const fragmentId = req.params.id;
  logger.info("Request to delete fragment's data and metadata by ID for user");

  try {
    const requestedFragment = await Fragment.byId(req.user, fragmentId);

    const fragment = new Fragment(requestedFragment);

    // Delete the fragment's data and metadata
    logger.info("Deleting the fragment's data and metadata");
    await Fragment.delete(fragment.ownerId, fragment.id);

    logger.info('Fragment data and metadata deleted successfully');

    // Send the success response
    return res.status(201).send(createSuccessResponse());
  } catch (error) {
    // Throw an error if the requested fragment does not exist
    if (error.message === 'Fragment does not exist') {
      logger.error('Fragment does not exist', { userId: req.user.id, fragmentId });
      return res
        .status(404)
        .send(createErrorResponse(404, "The requested fragment doesn't exist."));
    }
    // Catch any errors that occur during the fragment fetching process
    logger.error(
      'An error occurred while deleting fragment data and metadata for the user:',
      error.message
    );
    res.status(500).send(createErrorResponse(500, 'Internal Server Error'));
  }
};
