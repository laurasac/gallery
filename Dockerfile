FROM node:14.13.0-alpine3.11
WORKDIR /home/node/app
COPY . /home/node/app
ENV NODE_ENV=local
RUN npm install
EXPOSE 3000
ENTRYPOINT npm run db:start && npm run api:start