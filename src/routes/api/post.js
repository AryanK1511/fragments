const { createSuccessResponse, createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const contentType = require('content-type');
const logger = require('../../logger');
const { validateFragment } = require('../../utils/tools/validateFragment');

// ===== Create a fragment for the user =====
module.exports.createFragment = async (req, res) => {
  try {
    logger.info('Creating a fragment for the user');

    // Throw an error if the body is not a Buffer and\or is not supported by our application
    if (!Buffer.isBuffer(req.body)) {
      logger.error('Unsupported Content-Type Header');
      return res.status(415).send(createErrorResponse(415, 'Unsupported Content-Type'));
    }

    // Parse the content type from the request
    const { type } = contentType.parse(req);
    const size = req.body.length;

    logger.debug({ type, size }, 'Parsed content type and size from request');

    // Check whether the fragment data matches the content type
    // If the fragment is invalid, the function throws an error
    try {
      validateFragment(req.body, type);
    } catch (error) {
      return res
        .status(415)
        .send(createErrorResponse(415, `Unsupported Content-Type. ${error.message}`));
    }

    // Create and save the new fragment
    const fragment = new Fragment({
      ownerId: req.user, // Email is hashed already due to the middleware
      type: type,
      size: size,
    });

    // Save the fragment metadata
    logger.info('Saving the fragment metadata');
    await fragment.save();

    // Save the fragment data
    logger.info('Saving the fragment data');
    await fragment.setData(req.body);

    // Fetch the saved fragment
    const storedFragment = await Fragment.byId(req.user, fragment.id);

    logger.info('Fragment created successfully');

    // Set the location header to the location of the new fragment
    res.location(`${req.protocol}://${req.headers.host}/v1/fragments/${fragment.id}`);

    // Send the success response
    return res.status(201).send(createSuccessResponse({ fragment: storedFragment }));
  } catch (error) {
    logger.error({ err: error.message }, 'An error occurred while creating a fragment');
    return res
      .status(500)
      .send(createErrorResponse(500, `Internal Server Error: ${error.message}`));
  }
};
