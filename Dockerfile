FROM node:20-alpine AS unc-backend

WORKDIR /app

# Copy only package files first for better caching
COPY package.json pnpm-lock.yaml ./

# Install global and project dependencies
RUN npm install -g pnpm
RUN pnpm install

# Copy the rest of the project files
COPY . .
RUN pnpm p:migrate:seed
# Generate Prisma client
RUN pnpx prisma generate

# Build the project
RUN pnpm build

# Prune production dependencies
RUN pnpm prune --production

CMD ["node","dist/index.js"]