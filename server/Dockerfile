# server/Dockerfile

FROM node:18-alpine as builder
WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./
RUN npm install

# Copy only server code
COPY server/ ./server/

# (Optional) If you have a build step (TypeScript):
# RUN npm run build --workspace=server

FROM node:18-alpine
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server ./server

EXPOSE 3000
CMD ["node", "server/index.js"]
