const { createSuccessResponse, createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const contentType = require('content-type');
const logger = require('../../logger');

// ===== Create a fragment for the user =====
module.exports.createFragment = async (req, res) => {
  try {
    logger.info('Creating a fragment for the user');

    // Check if the body type is a Buffer
    if (Buffer.isBuffer(req.body)) {
      // Get the content type
      const { type } = contentType.parse(req);
      const size = req.body.length;

      logger.info({ type, size }, 'Parsed content type and size from request');

      // Create a new fragment
      let fragment = new Fragment({
        ownerId: req.user, // Email is hashed already due to the middleware
        type: type,
        size: size,
      });

      // Save the fragment and the data of the fragment
      logger.info('Saving the fragment metadata');
      await fragment.save();

      logger.info('Saving the fragment data');
      await fragment.setData(req.body);

      // Fetch the fragment once it is saved
      const storedFragment = await Fragment.byId(req.user, fragment.id);

      logger.info('Fragment created successfully');

      // Set the location header to the location of the new fragment
      res.location(`${req.protocol}://${req.headers.host}/v1/fragments/${fragment.id}`);

      res.status(201).send(createSuccessResponse({ fragment: storedFragment }));
    } else {
      logger.error('Unsupported Content-Type Header');
      res.status(415).send(createErrorResponse(415, 'Unsupported Content-Type'));
    }
  } catch (error) {
    logger.error({ err: error }, 'An error occurred while creating a fragment');
    res.status(500).send(createErrorResponse(500, 'Internal Server Error'));
  }
};
