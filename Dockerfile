# Base image - 'bookworm' (Debian 12) use kaila se 404 error fix ho jaai
FROM node:20-bookworm

# Install Chromium and dependencies for whatsapp-web.js
RUN apt-get update && apt-get install -y \
    chromium \
    libnss3 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer to use the installed Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

# Running with tsx, exactly how you ran it successfully on your MacBook!
CMD ["npx", "tsx", "src/app.ts"]