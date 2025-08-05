FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create records directory
RUN mkdir -p records

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"] 