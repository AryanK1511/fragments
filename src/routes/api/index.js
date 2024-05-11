const express = require('express');

// Create a router on which to mount our API endpoints
const router = express.Router();

// GET /v1/fragments
router.get('/fragments', require('./get'));

module.exports = router;
