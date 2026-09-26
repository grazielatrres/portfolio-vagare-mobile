FROM node:22-alpine

WORKDIR /app

ENV EXPO_NO_TELEMETRY=1

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .

# 8081: Metro / Expo Web
EXPOSE 8081

CMD ["yarn", "expo", "start", "--host", "lan", "--port", "8081"]
