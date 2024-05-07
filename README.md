# Fragments API Backend

Cloud-based CRUD microservice for managing fragments of text and images accessible through a RESTful API and deployed on AWS.

## How to run this project?

Clone this repository on your local computer and run the following command in the root of your project folder to install all the dependencies related to this project:

```bash
npm install
```

### Checking for errors in the code

To check for errors in the code using ESLint, run the following command:

```bash
npm run lint
```

This script runs ESLint to check for syntax and style errors in your code. It's useful for ensuring your code follows a consistent style and best practices. If you run this command and do not see any errors, you are good to go.

### Debug Mode

To run the code in debug mode, use the following command:

```bash
npm debug
```

This runs a command underneath the hood that allows you to connect your application to tools such as VSCode Debugger.

### Running the Development Server

To run the Express server in Development, use the following command:

```bash
npm run dev
```

When you run the server normally (npm start), it starts the server using the node command. This starts the server in a production-like environment, meaning it runs without any additional development features like auto-reloading when files change.

On the other hand, when you run the server in development mode (npm run dev), it starts the server using nodemon. nodemon is a utility that monitors for any changes in your source code and automatically restarts the server when changes are detected. This is extremely helpful during development as it saves you from manually stopping and restarting the server every time you make a change to your code.

The difference between running the

### Starting the Server

To run the Express server, use the following command:

```bash
npm start
```

## Author

[Aryan Khurana](https://github.com/AryanK1511)
