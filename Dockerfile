# Build stage
FROM node:22-slim AS build

WORKDIR /dashboard
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime stage
FROM node:22-slim AS runtime

# Create non-root user with gpio group access
RUN groupadd -r gpio && useradd -m -s /bin/bash -g gpio pi

COPY --from=build /dashboard/build /home/pi/dashboard/build
COPY --from=build /dashboard/node_modules /home/pi/dashboard/node_modules
COPY --from=build /dashboard/package.json /home/pi/dashboard/package.json

RUN mkdir -p /home/pi/dashboard/data && chown -R pi:gpio /home/pi/dashboard

ENV PORT=3000
ENV DATA_DIR=/home/pi/dashboard/data

USER pi
EXPOSE 3000

WORKDIR /home/pi/dashboard
CMD ["node", "build"]
