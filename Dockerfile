FROM node:16

WORKDIR /usr/src/app

COPY package*.json ./
COPY .npmrc ./

RUN npm install
RUN npm install --global http-server

COPY . .

RUN yarn install
RUN yarn build

CMD [ "npx", "http-server", "build" ]
