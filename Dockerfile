# Use build stage for building typescript code
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:24-alpine AS runner
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
# If using SQLite locally, ensure folder permission is writable
# SQLite DB file will be created at runtime in /app directory or as configured.

EXPOSE 3000
CMD ["node", "dist/main"]
