FROM node:6.9.1-alpine
MAINTAINER vidhill

# Define env vars
ENV token="none"
ENV organizer="none"
ENV group="none"

#This is needed for some of the dependencies to work.
RUN apk add --no-cache python build-base bash git openssh

# Create app directory
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app

COPY package*.json ./

USER node

RUN npm install

COPY --chown=node:node . .

CMD ["sh", "-c", "node app.js -t ${token} -o ${organizer} -g ${group}"]

