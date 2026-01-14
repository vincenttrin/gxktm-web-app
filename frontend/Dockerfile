# Use the official lightweight Node.js image
FROM node:22-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package files first (to cache dependencies)
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose Port 3000 to the host
EXPOSE 3000

# Start the application in development mode
CMD ["npm", "run", "dev"]