# Dockerfile to give instrcutions to Docker on how to create an image
FROM node:20.11.0

# Metadata
LABEL maintainer="Aryan Khurana <akhurana22@myseneca.ca>"
LABEL description="Fragments node.js microservice"

# Environment Variables
ENV PORT=8080

# Use /app as our working directory
WORKDIR /app

# All of the files will be copied into the working dir `./app`
COPY package*.json ./

# Install node dependencies defined in package-lock.json
RUN npm install

# Copy src to /app/src/
COPY ./src ./src

# Copy our HTPASSWD file
COPY ./tests/.htpasswd ./tests/.htpasswd

# Start the container by running our server
CMD npm start

# We run our service on port 8080
EXPOSE 8080
