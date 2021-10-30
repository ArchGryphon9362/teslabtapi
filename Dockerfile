FROM node:16

WORKDIR /usr/src/app

COPY package.json ./
COPY yarn.lock ./

RUN yarn global add http-server
RUN yarn install

COPY ["./docs", "./src", "./babel.config.js", "docusaurus.config.js", "sidebars.js", "./"]

RUN yarn build

COPY ./static .

CMD [ "npx", "http-server", "build" ]
