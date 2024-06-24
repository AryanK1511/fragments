# ==================== Stage 0: Install all the base dependencies ====================

# Using the larger version of node to install the dependencies
FROM node:20.11.0@sha256:7bf4a586b423aac858176b3f683e35f08575c84500fbcfd1d433ad8568972ec6 AS dependencies

# Set working directory
WORKDIR /app

# Copy package files over to the working directory
COPY package.json package-lock.json ./

# Install all the production dependencies using the package-lock.json file
RUN npm ci --only=production

# ==================== Stage 1: Run the node server ====================

# Using a smaller (apline) version of node after the dependencies are installed
FROM node:20.11.0-alpine3.19@sha256:2f46fd49c767554c089a5eb219115313b72748d8f62f5eccb58ef52bc36db4ad AS production

# Metadata
LABEL maintainer="Aryan Khurana <akhurana22@myseneca.ca>"\
      description="Fragments node.js microservice"

# Set the NODE_ENV to production 
# so that some optimizations are applied automatically to run in production
ENV NODE_ENV=production

# Set working directory
WORKDIR /app

# Copying over the node_modules folder from the 'dependencies' stage
# Also copy the package files to the working directory
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/package.json /app/package-lock.json ./

# Copy the rest of the application source code into the app/src directory
# Also copy over the .htpasswd file to run the container using basic auth
COPY ./src ./src
COPY ./tests/.htpasswd ./tests/.htpasswd

# Change ownership of the application files inside the /app directory
RUN chown -R node:node /app

# Switch to a node (non-root) user
USER node

# Expose the application port
EXPOSE 8080

# A healthcheck to make sure the API is running
# Using wget to avoid installing curl
HEALTHCHECK --interval=60s --timeout=60s \
            CMD wget -q --spider http://localhost:8080/ || exit 1

# Start the application using node as we do not need to use npm 
# This is because npm has to start multiple processes
CMD ["node", "src/index.js"]
