# Build stage
FROM node:20-slim AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime stage
FROM node:20-slim AS runtime

WORKDIR /app

COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./

ENV PORT=3000
ENV DATA_DIR=/app/data

# Create non-root user with gpio group access
RUN groupadd -r gpio && useradd -r -g gpio -G node pirack && \
    mkdir -p /app/data && chown -R pirack:gpio /app

USER pirack

EXPOSE 3000

CMD ["node", "build"]
