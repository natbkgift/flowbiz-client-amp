FROM node:20-alpine AS builder

WORKDIR /app
ARG LOCAL_API_ORIGIN=
ARG LOCAL_MEDIA_ORIGIN=
ENV LOCAL_API_ORIGIN=$LOCAL_API_ORIGIN
ENV LOCAL_MEDIA_ORIGIN=$LOCAL_MEDIA_ORIGIN
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
