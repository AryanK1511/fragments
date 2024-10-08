// Use Amazon Cognito for Authentication in production
if (
  process.env.USE_AWS_AUTH === 'true' &&
  process.env.AWS_COGNITO_POOL_ID &&
  process.env.AWS_COGNITO_CLIENT_ID
) {
  module.exports = require('./cognito');
}

// Also allow for an .htpasswd file to be used in development and for running tests
else if (process.env.USE_AWS_AUTH !== 'true' && process.NODE_ENV !== 'production') {
  module.exports = require('./basic-auth');
}

// In all other cases, an error is thrown
else {
  throw new Error('missing env vars: no authorization configuration found');
}
