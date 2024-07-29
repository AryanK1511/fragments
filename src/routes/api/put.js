const logger = require('../../logger');
const { Fragment } = require('../../model/fragment');
const contentType = require('content-type');
const { validateFragment } = require('../../utils/types/typeValidation');
const { createSuccessResponse, createErrorResponse } = require('../../response');

// ===== Allows users to update a fragment's data =====
module.exports.updateFragmentData = async (req, res) => {
  const fragmentId = req.params.id;
  logger.info('Request to update fragment by ID for user');

  try {
    // Throw an error if the body is not a Buffer and/or is not supported by our application
    if (!Buffer.isBuffer(req.body)) {
      logger.error('Unsupported Content-Type Header');
      return res.status(415).send(createErrorResponse(415, 'Unsupported Content-Type'));
    }

    // The body of the fragment should not be empty
    if (!(req.body.length > 0)) {
      logger.error('Fragment cannot be null');
      return res.status(400).send(createErrorResponse(400, 'Fragment cannot be null'));
    }

    // Parse the content type from the request
    const { type, parameters } = contentType.parse(req);
    const charset = parameters.charset || null; // Default to null if there are no parameters specified
    const size = req.body.length;

    logger.debug({ type, charset, size }, 'Parsed content type, charset, and size from request');

    const requestedFragment = await Fragment.byId(req.user, fragmentId);
    const fragment = new Fragment(requestedFragment);

    // Update the new fragment params
    fragment.size = size;

    // Check whether the fragment data matches the content type
    // If the fragment is invalid, the function throws an error
    try {
      await validateFragment(req.body, type);
    } catch (error) {
      return res
        .status(415)
        .send(createErrorResponse(415, `Unsupported Content-Type. ${error.message}`));
    }

    if (type !== fragment.mimeType) {
      logger.error("A fragment's type can not be changed after it is created.");
      return res
        .status(400)
        .send(
          createErrorResponse(400, "A fragment's type can not be changed after it is created.")
        );
    }

    // Save the fragment metadata
    logger.info('Saving the fragment metadata');
    await fragment.save();

    // Save the fragment data
    logger.info('Saving the fragment data');
    await fragment.setData(req.body);

    // Fetch the saved fragment
    const storedFragment = await Fragment.byId(req.user, fragment.id);

    logger.info('Fragment updated successfully');

    // Set the location header to the location of the updated fragment
    res.location(`${req.protocol}://${req.headers.host}/v1/fragments/${storedFragment.id}`);

    // Send the success response
    return res.status(201).send(createSuccessResponse({ fragment: storedFragment }));
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
