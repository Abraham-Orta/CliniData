# Dockerfile for Clinidata backend
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production --silent

# Copy app files
COPY . .

EXPOSE 3000
ENV NODE_ENV=production

CMD ["node", "index.js"]
