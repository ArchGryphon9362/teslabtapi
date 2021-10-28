# Contributing

## Prerequisites
To be able to develop this project locally, you must have Node.JS 16+ installed.
You will also need Git if you want to clone the project locally

## How to edit
To edit this documentation, you will need to fork the repository, and clone it using Git. Now, to edit any of the documentation, you may do so by editing the markdown files in `docs/`.

## How do I preview the website locally
First of all, you'll need to install all the Node.JS dependencies; you may do so using the following command:
```sh
npm install
```
After you install the Node.JS dependencies, you have to install all the yarn dependencies:
```sh
yarn install
```
Next, to spin up a local test server, you may run the following command:
```sh
yarn start
```
You should now have a local test server running on [`localhost:3000`](http://localhost:3000) which update live as soon as you save any of the markdown files!

## After you're done
After you're done, you should push the changes back onto your Github repository, and can create a pull request which will be reviewed and most likely merged!
