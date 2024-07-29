# Running the API locally

## Initial Setup

### Clone the Repository

Clone this repository on your local computer:

```bash
git clone <repository-url>
cd <repository-folder>
```

### Install Dependencies

Run the following command in the root of your project folder to install all the dependencies:

```bash
npm install
```

## Running the Project

### Checking for Errors

To check for errors in the code using ESLint, run the following command:

```bash
npm run lint
```

### Debug Mode

To run the code in debug mode or to integrate the code with the VSCode default debugger, use the following command:

```bash
npm debug
```

### Running the Development Server

To run the Express server in Development mode, use the following command:

```bash
npm run dev
```

This starts the server using `nodemon`, which monitors for any changes in your source code and automatically restarts the server when changes are detected.

### Starting the Server

To run the Express server, use the following command:

```bash
npm start
```

This starts the server using the `node` command, suitable for production-like environments.

## Setting up `docker-compose`

Since this microservice uses an AWS S3 bucket and DynamoDB to store fragment data and metadata respectively, we use Docker Compose to mock these services as containers for local testing. The `docker-compose.yml` file sets up local containers for LocalStack (mocking S3 and DynamoDB) and our Fragments Microservice, allowing everything to work together seamlessly.

## Some terms

- **AWS S3 and DynamoDB**: These services are used for storing fragment data and metadata.
- **Docker Compose**: A tool for defining and running multi-container Docker applications.
- **LocalStack**: A fully functional local AWS cloud stack to mock AWS services for local testing.

By using Docker Compose and LocalStack, you can run and test the entire microservice locally without needing access to actual AWS resources.

For more information, check out the following links:

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [LocalStack Documentation](https://docs.localstack.cloud/)

## Starting the containers

> **NOTE:** You can always configure your own environment variables and then use them to run the docker containers by changing the name of the env file in the `docker-compose.yml` file from `env.testing` to whatever env file you are using. However, for the best testing configuration, I would recommend using the default. The default env file, `env.testing`, configures the containers to use Basic Auth and it also specifies the URLs and credentials so you do not need to do anything.

> **Testing using the [fragments UI](https://github.com/AryanK1511/fragments-ui):** If you are testing this API using the fragments UI, be sure to set the `USE_AWS_AUTH` variable to `true` and also provide the `AWS_COGNITO_POOL_ID` and `AWS_COGNITO_CLIENT_ID` as the UI uses AWS cognito for authentication.

1. Navigate to the root of your repository using your terminal and run the following command.

   ```bash
   docker-compose up --build -d
   ```

   - The `-d` flag makes sure that the containers run in the background and do not take up the terminal screen.
   - The `--build` flag ensures that the containers are rebuilt, even if they were previously built.

2. Run the `./scripts/local-aws-setup.sh` script in your terminal. This script will create an S3 bucket and a DynamoDB table in localstack which we would later use for testing purposes.

3. Once the above steps are done, you are ready to start using your API in development. You can [test the API using curl](./testing_with_curl.md) or can [run the unit + integration tests](./running_the_test_cases.md) to test the API if required.
