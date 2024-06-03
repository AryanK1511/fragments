const { createSuccessResponse, createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const contentType = require('content-type');
const logger = require('../../logger');
const hashEmail = require('../../hash');

// ===== Create a fragment for the user =====
module.exports = async (req, res) => {
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
    const result = await Fragment.byId(hashedUserEmail, fragment.id);

    res.status(201).send(createSuccessResponse({ fragment: result }));
  } else {
    res.status(400).send({ error: 'Invalid content type' });
  }
};
