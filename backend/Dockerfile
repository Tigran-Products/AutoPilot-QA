# Must match playwright version in package.json (1.60.0)
FROM mcr.microsoft.com/playwright:v1.60.0-noble

WORKDIR /app

ENV NODE_ENV=production
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npx playwright install chromium

COPY server.js stepExecutor.js ./
COPY middleware/ ./middleware/

EXPOSE 3001

CMD ["node", "server.js"]
