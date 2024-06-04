const express = require('express');
const { Fragment } = require('../../model/fragment');
const contentType = require('content-type');
const { getFragmentsList, getFragmentById } = require('./get');
const { createFragment } = require('./post');

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
router.get('/fragments', getFragmentsList);

// GET /v1/fragments/:id
router.get('/fragments/:id', getFragmentById);

// POST /v1/fragments
router.post('/fragments', rawBody(), createFragment);

module.exports = router;
