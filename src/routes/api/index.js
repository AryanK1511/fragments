const express = require('express');
const { Fragment } = require('../../model/fragment');
const contentType = require('content-type');
const { getFragmentsList, getFragmentById, getFragmentInfoById } = require('./get');
const { deleteFragment } = require('./delete');
const { createFragment } = require('./post');
const { updateFragmentData } = require('./put');

// Middleware to parse binary blobs as body
const rawBody = () =>
  express.raw({
    inflate: true,
    limit: '5mb',
    type: (req) => {
      const { type } = contentType.parse(req);
      return Fragment.isSupportedType(type);
    },
  });

// Create a router on which to mount our API endpoints
const router = express.Router();

// GET /v1/fragments
// Returns a list of all fragment IDs for a user
// Can use the ?expand=1 query to get an expanded list of metadata for all fragments related to the user
router.get('/fragments', getFragmentsList);

// GET /v1/fragments/:id
// Returns the data of a fragment based on ID
// Supports extensions and file conversions
router.get('/fragments/:id', getFragmentById);

// GET /v1/fragments/:id/info
// Returns the metadata of a fragment based on ID
router.get('/fragments/:id/info', getFragmentInfoById);

// POST /v1/fragments
// Creates a new fragment for the authenticated user
router.post('/fragments', rawBody(), createFragment);

// PUT /v1/fragments/:id
// Allows users to update an existing fragment's data
router.put('/fragments/:id', rawBody(), updateFragmentData);

// DELETE /v1/fragments/:id
// Deletes a fragment's metadata and data
router.delete('/fragments/:id', deleteFragment);

module.exports = router;
