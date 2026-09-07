# Node.js 22 LTS, pinned by digest so local and CI build the exact same base.
# Dependabot bumps this line; re-pin manually with:
#   docker inspect node:22-slim --format '{{index .RepoDigests 0}}'
FROM node:22-slim@sha256:83f487e0a63425e5b4d146fb5e5be574bcbe1b7b843d3ebafdd95eaf7767a7e5

# Set the working directory in the container.
WORKDIR /app

# Drop root before installing or building: nothing here needs privileges,
# and the running container should not have them either (OWASP A05).
RUN chown node:node /app
USER node

# package-lock.json is the authoritative lockfile — the CI installs with the
# same `npm ci`, so the image and the pipeline resolve identical trees.
COPY --chown=node:node package.json package-lock.json ./

# Install dependencies. devDependencies are needed: the Tailwind PostCSS
# plugin and the React compiler run during `next build`.
RUN npm ci

# Copy the rest of the application code.
COPY --chown=node:node . .

# Build arg for Next.js public env vars (embedded at build time)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ARG INTERNAL_API_URL
ENV INTERNAL_API_URL=$INTERNAL_API_URL

# Build the Next.js application.
RUN npm run build

# Only after the build: the build itself needs the devDependencies.
ENV NODE_ENV=production

# Expose the port the app runs on.
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Define the command to start the application.
CMD ["npm", "run", "start"]
