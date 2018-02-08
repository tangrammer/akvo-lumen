#!/usr/bin/env bash

set -eu

function log {
   echo "$(date +"%T") - INFO - $*"
}

log Bulding container to run the backend tests
docker build --rm=false -t akvo-lumen-backend-dev:develop backend -f backend/Dockerfile-dev
log Running Backend unit tests and building uberjar
docker run --env-file=.env -v "$HOME/.m2:/home/akvo/.m2" -v "$(pwd)/backend:/app" akvo-lumen-backend-dev:develop /app/run-as-user.sh lein "do" test, uberjar

cp backend/target/uberjar/akvo-lumen.jar backend

log Creating Production Backend image
docker build --rm=false -t eu.gcr.io/${PROJECT_NAME}/lumen-backend:${TRAVIS_COMMIT} ./backend
docker tag eu.gcr.io/${PROJECT_NAME}/lumen-backend:${TRAVIS_COMMIT} eu.gcr.io/${PROJECT_NAME}/lumen-backend:develop

#rm backend/akvo-lumen.jar

log Production Backend image built
