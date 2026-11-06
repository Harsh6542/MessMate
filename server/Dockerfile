# Build stage for MessMate Backend API
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application source code
COPY . .

# Expose backend port
EXPOSE 5000

# Environment variables default
ENV PORT=5000
ENV NODE_ENV=production

# Start the server
CMD ["node", "src/server.js"]

