FROM node:20-slim

# Create app directory
WORKDIR /app

# Install native compilation tools required for better-sqlite3
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy application source
COPY . .

# Build the Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Create necessary directories
RUN mkdir -p /app/data /app/public/uploads

# Set environment variables for production
ENV NODE_ENV=production
ENV DB_PATH=/app/data/bingo.sqlite
ENV PORT=3000

# Expose the API port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
