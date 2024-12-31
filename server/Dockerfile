# Stage 1: Dependencies & Build
FROM node:18-alpine as builder

WORKDIR /app

# Copy root package.json and lock file
COPY package.json package-lock.json ./
RUN npm install

# Copy in only the server code
COPY server/ ./server/

# Optional: If you have a build step (TypeScript -> JavaScript)
# RUN npm run build --workspace=server

# Stage 2: Runtime
FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server ./server

# Expose the port Fly expects (often 3000)
EXPOSE 3000

ENV NODE_ENV=production
CMD ["node", "server/index.js"]  # Or your built output (e.g., dist/index.js)
