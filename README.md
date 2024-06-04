# Fragments API Backend

Cloud-based CRUD microservice for managing fragments of text and images accessible through a RESTful API and deployed on AWS.

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-232F3E?style=for-the-badge&logo=amazon-aws&logoColor=white)

## Table of Contents

- [Technologies](#technologies)
  - [Languages](#languages)
  - [Frameworks and Libraries](#frameworks-and-libraries)
  - [Development Tools](#development-tools)
- [Setup](#setup)
  - [Clone the Repository](#clone-the-repository)
  - [Install Dependencies](#install-dependencies)
  - [Environment Variables](#environment-variables)
- [Running the Project](#running-the-project)
  - [Checking for Errors](#checking-for-errors)
  - [Debug Mode](#debug-mode)
  - [Running the Development Server](#running-the-development-server)
  - [Starting the Server](#starting-the-server)
- [Author](#author)

## Technologies

### Languages

- [JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

### Frameworks and Libraries

- [Express](https://expressjs.com/)
- [Passport](http://www.passportjs.org/)
- [passport-http-bearer](http://www.passportjs.org/packages/passport-http-bearer/)
- [aws-jwt-verify](https://github.com/awslabs/aws-jwt-verify)
- [compression](https://www.npmjs.com/package/compression)
- [cors](https://www.npmjs.com/package/cors)
- [dotenv](https://www.npmjs.com/package/dotenv)
- [helmet](https://helmetjs.github.io/)
- [http-auth](https://www.npmjs.com/package/http-auth)
- [http-auth-passport](https://www.npmjs.com/package/http-auth-passport)
- [pino](https://getpino.io/)
- [pino-http](https://github.com/pinojs/pino-http)
- [pino-pretty](https://github.com/pinojs/pino-pretty)
- [stoppable](https://www.npmjs.com/package/stoppable)

### Development Tools

- [Nodemon](https://nodemon.io/)
- [Jest](https://jestjs.io/)
- [ESLint](https://eslint.org/)
- [Prettier](https://prettier.io/)
- [Supertest](https://github.com/visionmedia/supertest)

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
| `AWS_COGNITO_POOL_ID`   | Identifier for your Amazon Cognito User Pool.                   | N/A                                                                                              | `us-west-2_ABC123` |
| `AWS_COGNITO_CLIENT_ID` | Identifier for your application registered with Amazon Cognito. | N/A                                                                                              | `abcdef123456`     |
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

## Author

[Aryan Khurana](https://github.com/AryanK1511)
