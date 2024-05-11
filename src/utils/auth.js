// Configure a JWT token strategy for Passport based on Identity Token provided by Cognito.
// The token will be parsed from the Authorization header (i.e., Bearer Token).

const passport = require('passport');
const BearerStrategy = require('passport-http-bearer').Strategy;
const { CognitoJwtVerifier } = require('aws-jwt-verify');

const logger = require('../logger');

// Create a Cognito JWT Verifier, which will confirm that any JWT we get from a user is valid and something we can trust.
const jwtVerifier = CognitoJwtVerifier.create({
  userPoolId: process.env.AWS_COGNITO_POOL_ID,
  clientId: process.env.AWS_COGNITO_CLIENT_ID,
  tokenUse: 'id',
});

logger.info('Configured to use AWS Cognito for Authorization');

// At startup, download and cache the public keys (JSON Web Key Sets) we need in order to verify our Cognito JWTs
jwtVerifier
  .hydrate()
  .then(() => {
    logger.info('Cognito JWKS successfully cached');
  })
  .catch((err) => {
    logger.error({ err }, 'Unable to cache Cognito JWKS');
  });

// For our Passport authentication strategy, we'll look for the Bearer Token in the Authorization header, then verify that with our Cognito JWT Verifier.
module.exports.strategy = () =>
  new BearerStrategy(async (token, done) => {
    try {
      // Verify this JWT
      const user = await jwtVerifier.verify(token);
      logger.debug({ user }, 'verified user token');

      // Create a user, but only bother with their email. We could
      // also do a lookup in a database, but we don't need it.
      done(null, user.email);
    } catch (err) {
      logger.error({ err, token }, 'could not verify token');
      done(null, false);
    }
  });

module.exports.authenticate = () => passport.authenticate('bearer', { session: false });
