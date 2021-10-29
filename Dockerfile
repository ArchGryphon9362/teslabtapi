FROM node:16

WORKDIR /usr/src/app

COPY package.json ./
COPY .npmrc ./

RUN npm install --global yarn
RUN npm install --global http-server
RUN yarn install

COPY . .

RUN yarn build

CMD [ "npx", "http-server", "build" ]
