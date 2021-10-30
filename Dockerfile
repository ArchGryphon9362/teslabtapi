FROM node:16

WORKDIR /usr/src/app

COPY package.json ./
COPY yarn.lock ./

RUN yarn global add http-server
RUN yarn install

COPY docs/ ./docs/
COPY src/ ./src/
COPY babel.config.js ./
COPY docusaurus.config.js ./
COPY sidebars.js ./

RUN yarn build

COPY ./static .

CMD [ "npx", "http-server", "build" ]
