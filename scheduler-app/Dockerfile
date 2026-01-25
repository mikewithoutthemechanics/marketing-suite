FROM node:18-alpine

WORKDIR /usr/src/app

# Install dependencies first for better caching
COPY package.json package-lock.json* ./
RUN npm install --production || true

# Copy rest
COPY . .

EXPOSE 4000

ENV NODE_ENV=production

CMD [ "node", "index.js" ]
