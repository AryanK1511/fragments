const { createSuccessResponse } = require('../../response');

// Get a list of fragments for the current user
module.exports = (req, res) => {
  res.status(200).json(
    createSuccessResponse({
      status: 'ok',
      fragments: [],
    })
  );
};
