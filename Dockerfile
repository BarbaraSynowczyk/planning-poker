FROM node:24-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

USER node


FROM gcr.io/distroless/nodejs24-debian13:nonroot

WORKDIR /app

COPY --from=build /app /app

CMD ["src/app.js"]
