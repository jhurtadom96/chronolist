# Dockerfile for ChronoList
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install --production

# Copy source
COPY . .

ENV NODE_ENV=production
ENV PORT=3000
# Change this in your deployment environment
ENV ADMIN_TOKEN=changeme

EXPOSE 3000
CMD ["node", "server.js"]
