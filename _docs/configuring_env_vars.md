# Configuring the environment using the `.env` file

This document outlines the environment variables used to configure the Fragments Microservice. Each environment variable is detailed below in a tabular format, explaining its purpose and usage.

## Environment Variables

| Variable Name             | Description                                                                                                                                  | Example Value                              |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `NODE_ENV`                | Specifies the environment mode. In `development`, logging is set to debug mode. In `production`, standard logs are used.                     | `development`, `production`                |
| `AWS_COGNITO_POOL_ID`     | The Amazon Cognito User Pool ID for user authentication. Required if `USE_AWS_AUTH` is `true`.                                               | `us-east-1_C0rmjoZwe`                      |
| `AWS_COGNITO_CLIENT_ID`   | The Amazon Cognito Client ID for the application. Required if `USE_AWS_AUTH` is `true`.                                                      | `7lksepmgjsq3aspmf7uqa3hucu`               |
| `HTPASSWD_FILE`           | Path to the file containing acceptable usernames and passwords for the application. Required if `USE_AWS_AUTH` is `false`.                   | `tests/.htpasswd`                          |
| `PORT`                    | Specifies the port on which the microservice runs.                                                                                           | `8080`                                     |
| `USE_AWS_AUTH`            | Determines whether AWS Cognito authentication is used (`true`) or not (`false`). If `false`, `HTPASSWD_FILE` is required. Ideal for testing. | `false`                                    |
| `USE_AWS_MEMORY`          | Determines whether AWS S3 and DynamoDB are used (`true`) or local memory storage (`false`). If `false`, in-memory database is used.          | `false`                                    |
| `AWS_REGION`              | Specifies the AWS region for the resources.                                                                                                  | `us-east-1`                                |
| `AWS_ACCESS_KEY_ID`       | AWS access key ID for authentication. Required if `USE_AWS_MEMORY` is `true` and actual AWS resources are used.                              | `ASIAZHEF34QZUULOG6NA`                     |
| `AWS_SECRET_ACCESS_KEY`   | AWS secret access key for authentication. Required if `USE_AWS_MEMORY` is `true` and actual AWS resources are used.                          | `jajZY96B+fvNqTvNyXtzm0AUr0fgHuGgeur8DH8a` |
| `AWS_SESSION_TOKEN`       | AWS session token for temporary credentials. Required if `USE_AWS_MEMORY` is `true` and actual AWS resources are used.                       | `IQoJb3JpZ2luX2VjEJ....`                   |
| `AWS_S3_BUCKET_NAME`      | Name of the AWS S3 bucket for storing fragment data. Required if `USE_AWS_MEMORY` is `true`.                                                 | `aryank1511-fragments`                     |
| `AWS_DYNAMODB_TABLE_NAME` | Name of the DynamoDB table for storing fragment metadata. Required if `USE_AWS_MEMORY` is `true`.                                            | `fragments`                                |

## Sample `.env` file

```bash
NODE_ENV=development
AWS_COGNITO_POOL_ID=us-east-1_C0rmjoZwe
AWS_COGNITO_CLIENT_ID=7lksepmgjsq3aspmf7uqa3hucu
HTPASSWD_FILE=tests/.htpasswd
PORT=8080
USE_AWS_AUTH=false
USE_AWS_MEMORY=false
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=ASIAZHEF34QZUULOG6NA
AWS_SECRET_ACCESS_KEY=jajZY96B+fvNqTvNyXtzm0AUr0fgHuGgeur8DH8a
AWS_SESSION_TOKEN='IQoJb3JpZ2luX2VjEJ///////////wEaCXVzLXdlc3QtMiJHMEUCIQDX7SwsUvqSeIGS6eSFSVAcHx6YsqGk2mmtXcFb7KiWJwIgNjZZQr1S+4uPw1R3ycYQcteowN94hc/Br4f/dJv60i0qsAIIeBACGgw2MzM3ODg0MjUyNjciDAhk+PdcnIt/NvpH7iqNAtA9UvP4JRywVZHAwUfw3yVNt26MutF9t6GvQSIbwVMCjvyKd4aghmky56z/2uarqb9TReIWk0jLByavQmP4LDq8AgtdkprK1X3hEc1875/fltLrh+b72ruuOMsgWEaNCFJkphPpbNIabSGppApVYIpU2W6ZgIHIeVomqNGo8pQqVOl3RrNpOMfvwuFeXUyVzk85U8hJ3TvMMIvaCtQbVf95ZULluPyGa/8QxTAPHDWODZ9u+BGFXtvezbQXySeLdxaDnCPir+lEgQgekUJgBIi1pzQbRHMl9uk48wdFdU0ADwkpb+DwyCmB0g177FVapfrPn95YO6Lr7z4VN7tRM8fQy5/Sl4YBweseZ4WMMNXq+bQGOp0BovaRtJzwJ3RD2Ti1OugM06a7Na83gvRAKS+iBs5RDDil3I4xapCSIClx8or4/M1rwSOO1IaWJx140M12hTScM+PGMwXj6nxmFhL3HBf7rqmOKV34kDNA3+RGNcaG9c2vo4X3dqG2/DKHczq9zxs+81W9EVZVrHLTugfS6dw8HOpRCVl3QvecWGfBqbFDWKYyrMRDITSf9uLZrrq0wA=='
AWS_S3_BUCKET_NAME=aryank1511-fragments
AWS_DYNAMODB_TABLE_NAME=fragments
```

## Configuration Details

- **Development vs. Production**:
  - Set `NODE_ENV` to `development` for debug mode logging.
  - Set `NODE_ENV` to `production` for standard logging.
- **Authentication**:

  - If `USE_AWS_AUTH` is `false`, the application will not use Amazon Cognito. Instead, it will use basic HTTP authentication based on the usernames and passwords defined in the `HTPASSWD_FILE`.
  - If `USE_AWS_AUTH` is `true`, valid AWS Cognito User Pool ID (`AWS_COGNITO_POOL_ID`) and Client ID (`AWS_COGNITO_CLIENT_ID`) are required.

- **Memory vs. AWS Services**:
  - If `USE_AWS_MEMORY` is `false`, the application will use local memory for storage.
  - If `USE_AWS_MEMORY` is `true`:
    - When running Docker Compose locally, you can use LocalStack for AWS S3 and DynamoDB emulation.
    - Ensure `AWS_REGION`, `AWS_S3_BUCKET_NAME`, and `AWS_DYNAMODB_TABLE_NAME` are correctly set.
    - For actual AWS usage, provide valid `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_SESSION_TOKEN`.

## Docker Compose Considerations

When running Docker Compose locally, you can use dummy values for `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`. `AWS_SESSION_TOKEN` is not needed. However, you still need to set `AWS_REGION`, `AWS_S3_BUCKET_NAME`, and `AWS_DYNAMODB_TABLE_NAME`.

Read the [docs](./running_locally.md) I wrote for running locally using docker compose is you wanna learn more about it.

If you are using actual AWS services, ensure that all AWS-related environment variables are correctly set to authenticate and interact with AWS resources.
