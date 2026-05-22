# Playwright image includes Chromium and system dependencies
FROM mcr.microsoft.com/playwright:v1.49.1-noble

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY server.js stepExecutor.js ./

ENV NODE_ENV=production
# Render sets PORT automatically
EXPOSE 3001

CMD ["node", "server.js"]
