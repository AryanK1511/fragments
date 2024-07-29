# Using the Automations

There are two bash scripts in this API under the `@/scripts/` directory.

## Using `local-aws-setup.sh`

This script is used to create an S3 bucket and a Dynamo DB table both called `fragments` in the localstack and dynamo DB containers that we are running using docker compose for development.

## Using `github-secrets-setup.sh`

This is used to update the GitHub encrypted secrets for the repository using GitHub CLI.

1. Create a `.env.github` file in the root of your repository.
2. Update all of your environment variables that you want to upload to your GitHub repo here in the following format.

```bash
NODE_ENV=production
AWS_COGNITO_POOL_ID=
AWS_COGNITO_CLIENT_ID=
PORT=80
USE_AWS_AUTH=true
USE_AWS_MEMORY=true
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_SESSION_TOKEN=
AWS_S3_BUCKET_NAME=aryank1511-fragments
AWS_DYNAMODB_TABLE_NAME=fragments
DOCKERHUB_TOKEN=
DOCKERHUB_USERNAME=
```

3. After this step, run the script and it will create the GitHub encrypted secrets for your repository.
