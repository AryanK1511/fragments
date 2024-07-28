# Configuring the environment using the `.env` file

## Setup

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

### Environment Variables

Create a `.env` file in the root of your project folder and configure the following variables:

```bash
NODE_ENV=XXXX # (development, production)
AWS_COGNITO_POOL_ID=XXXX
AWS_COGNITO_CLIENT_ID=XXXX
HTPASSWD_FILE=XXXX
PORT=XXXX
```

| Variable                | Description                                                     | Configuration options                                                                             | Example            |
| ----------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------ |
| `NODE_ENV`              | Sets up the environment that you want to run your code in.      | `development` would enable the DEV environment and `production` would enable the PROD environment | `development`      |
| `AWS_COGNITO_POOL_ID`   | Identifier for your Amazon Cognito User Pool.                   | N/A                                                                                               | `us-west-2_ABC123` |
| `AWS_COGNITO_CLIENT_ID` | Identifier for your application registered with Amazon Cognito. | N/A                                                                                               | `abcdef123456`     |
| `HTPASSWD_FILE`         | Path to the htpasswd file for basic authentication.             | N/A                                                                                               | `tests/.htpasswd`  |
| `PORT`                  | Port number on which your application will listen.              | Any available port number. `8080` by default.                                                     | `3000`             |

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
