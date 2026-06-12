# Use a lightweight Node.js image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package files first (for efficient caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# We will mount our code via volumes in dev, but copy it for the build
COPY . .

# Expose the port our app runs on
EXPOSE 4000

# Start the server in development mode
CMD ["npm", "run", "dev"]