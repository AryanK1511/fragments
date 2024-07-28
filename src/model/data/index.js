// If the environment sets an AWS Region, we'll use AWS backend
// services (S3, DynamoDB); otherwise, we'll use an in-memory db.

module.exports = process.env.USE_AWS_MEMORY === 'true' ? require('./aws') : require('./memory');
