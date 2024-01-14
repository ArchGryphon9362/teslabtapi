#!/bin/sh

git pull
docker build -t ghcr.io/archgryphon9362/teslabtapi2 .
docker push ghcr.io/archgryphon9362/teslabtapi2
