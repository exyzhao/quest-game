ARG NODE_VERSION=20.17.0

# Alpine image
FROM node:${NODE_VERSION}-alpine AS alpine
RUN apk update
RUN apk add --no-cache libc6-compat

# Setup npm on the alpine base
FROM alpine as base
RUN npm install turbo --global
RUN npm install npm --global --force

# Prune projects
FROM base AS pruner
ARG PROJECT

WORKDIR /app
COPY . .
RUN turbo prune --scope=${PROJECT} --docker

# Build the project
FROM base AS builder
ARG PROJECT

WORKDIR /app

# Copy lockfile and package.json's of isolated subworkspace
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/tsconfig.json ./tsconfig.json

# First install the dependencies (as they change less often)
RUN npm install --production=false

# Copy source code of isolated subworkspace
COPY --from=pruner /app/out/full/ .

#TODO: Uncomment the following line if you plan to use prisma
#RUN turbo run db:generate

RUN turbo run build

RUN npm install --production
RUN rm -rf ./**/*/src

# Final image
FROM alpine AS runner
ARG PROJECT

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs
USER nodejs

WORKDIR /app
RUN npm i debug
COPY --from=builder --chown=nodejs:nodejs /app .
WORKDIR /app/${PROJECT}

ARG PORT=3000
ENV PORT=${PORT}
ENV NODE_ENV=production
EXPOSE ${PORT}

CMD node dist/server/index