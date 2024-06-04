const express = require('express');
const { version, author, repository } = require('../../package.json');
const { authenticate } = require('../utils/auth');
const { createSuccessResponse } = require('../response');
const logger = require('../logger');

// Create a router that we can use to mount our API
const router = express.Router();

// Expose all of our API routes on /v1/* to include an API version.
// All routes can only be accessed by authenticated users
router.use(`/v1`, authenticate(), require('./api'));

// ===== Health Check Route to see whether the server is running =====
router.get('/', (req, res) => {
  logger.info('Hitting the health check route of the API');

  // Clients shouldn't cache this response (always request it fresh)
  res.setHeader('Cache-Control', 'no-cache');

  // Return the GitHub Repo details
  res.status(200).json(
    createSuccessResponse({
      status: 'ok',
      author,
      githubUrl: repository.url.replace(/^git\+|\.git$/g, ''),
      version,
    })
  );
});

module.exports = router;
