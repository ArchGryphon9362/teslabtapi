FROM node:16

WORKDIR /usr/src/app

COPY package.json ./
# COPY yarn.lock ./
# removed yarn.lock to prevent vulnerabilies (in short, just for auto updates)

RUN yarn global add http-server
RUN yarn install

COPY docs/ ./docs/
COPY src/ ./src/
COPY static/ ./static/
COPY babel.config.js ./
COPY docusaurus.config.js ./
COPY sidebars.js ./

RUN yarn build

RUN rm -r docs
RUN rm -r src
RUN rm -r static
RUN rm babel.config.js
RUN rm docusaurus.config.js
RUN rm sidebars.js


CMD [ "npx", "http-server", "build" ]
