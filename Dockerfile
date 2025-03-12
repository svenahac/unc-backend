FROM node:20-alpine AS unc-backend

WORKDIR /app

COPY . .

RUN npm install -g pnpm

RUN pnpm install

RUN pnpm build
RUN pnpm prune --production

# This is the command that will be run inside the image when you tell Docker to start the container
CMD ["node","dist/index.js"]