# Use the official Node.js 22 LTS image.
FROM node:26-slim

# Set the working directory in the container.
WORKDIR /app

# Drop root before installing or building: nothing here needs privileges,
# and the running container should not have them either (OWASP A05).
RUN chown node:node /app
USER node

# Copy package.json and yarn.lock to the working directory.
COPY --chown=node:node package.json yarn.lock ./

# Install dependencies.
RUN yarn install

# Copy the rest of the application code.
COPY --chown=node:node . .

# Build arg for Next.js public env vars (embedded at build time)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ARG INTERNAL_API_URL
ENV INTERNAL_API_URL=$INTERNAL_API_URL

# Build the Next.js application.
RUN yarn build

# Only after the build: the build itself needs the devDependencies.
ENV NODE_ENV=production

# Expose the port the app runs on.
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Define the command to start the application.
CMD ["yarn", "start"]
