FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
# --omit=optional evita compilar `canvas` (opcional de pdfjs-dist, no se usa
# para extraer texto y no compila en Alpine sin libs nativas).
RUN npm ci --omit=optional

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

FROM node:20-alpine AS runtime

ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev --omit=optional && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY migrations ./migrations

EXPOSE 3000

CMD ["node", "dist/index.js"]
