#!/usr/bin/env bash

set -eu

function log {
   echo "$(date +"%T") - INFO - $*"
}

log Building container to run the client tests
docker build --rm=false -t akvo-lumen-client-dev:develop client -f client/Dockerfile-dev
log Running Client linting, unit tests and creating production assets
docker run --env-file=.env -v "$(pwd)/client:/lumen" --rm=false -t akvo-lumen-client-dev:develop /lumen/run-as-user.sh /lumen/ci-build.sh

log Creating Production Client image
docker build --rm=false -t eu.gcr.io/${PROJECT_NAME}/lumen-client:${TRAVIS_COMMIT} ./client
docker tag eu.gcr.io/${PROJECT_NAME}/lumen-client:${TRAVIS_COMMIT} eu.gcr.io/${PROJECT_NAME}/lumen-client:develop
log Production Client image built
