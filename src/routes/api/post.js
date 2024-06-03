const { createSuccessResponse, createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const contentType = require('content-type');
const logger = require('../../logger');
const hashEmail = require('../../hash');

// ===== Create a fragment for the user =====
module.exports = async (req, res) => {
  try {
    logger.info('Creating a fragment for the user');

    // Check if the body type is a Buffer
    if (Buffer.isBuffer(req.body)) {
      // Hash the user's email
      const hashedUserEmail = hashEmail(req.user);

      // Get the content type
      const { type } = contentType.parse(req);

      // Create a new fragment
      let fragment = new Fragment({
        ownerId: hashedUserEmail,
        type: type,
        size: req.body.length,
      });

      // Save the fragment and the data of the fragment
      await fragment.save();
      await fragment.save(req.body);

      // Fetch the fragment once it is saved
      const storedFragment = await Fragment.byId(hashedUserEmail, fragment.id);

      // Return the fragment details back to the user
      logger.info('Fragment created successfully');

      // Set the location header to the location of the new fragment
      res.location(`${req.headers.host}/v1/fragments/${fragment.id}`);

      res.status(201).send(createSuccessResponse({ fragment: storedFragment }));
    } else {
      // Respond with an error if a Content-Type that is not supported by the API is passed
      logger.error('Content-Type Header not supported by API');
      res
        .status(400)
        .send(createErrorResponse(400, `Content-Type used in the request is not supported by API`));
    }
  } catch (error) {
    // Catch any errors that occur during the fragment creation process
    logger.error('An error occurred while creating a fragment:', error);
    res.status(500).send(createErrorResponse(500, 'Internal Server Error'));
  }
};
