#!/usr/bin/env bash

set -eu

function log {
   echo "$(date +"%T") - INFO - $*"
}

export PROJECT_NAME=akvo-lumen

log Building container to run the client tests
docker build --rm=false -t akvo-lumen-client-dev:develop client -f client/Dockerfile-dev
log Running Client linting, unit tests and creating production assets
docker run --env-file=.env -v "$(pwd)/client:/lumen" --rm=false -t akvo-lumen-client-dev:develop /lumen/run-as-user.sh /lumen/ci-build.sh

log Creating Production Client image
docker build --rm=false -t eu.gcr.io/${PROJECT_NAME}/lumen-client:${TRAVIS_COMMIT} ./client
docker tag eu.gcr.io/${PROJECT_NAME}/lumen-client:${TRAVIS_COMMIT} eu.gcr.io/${PROJECT_NAME}/lumen-client:develop
log Production Client image built

log Making sure gcloud and kubectl are installed and up to date
gcloud components install kubectl
gcloud components update
gcloud version
which gcloud kubectl

log Authentication with gcloud and kubectl
gcloud auth activate-service-account --key-file ci/gcloud-service-account.json
gcloud config set project akvo-lumen
gcloud config set container/cluster europe-west1-d
gcloud config set compute/zone europe-west1-d
gcloud config set container/use_client_certificate True

gcloud container clusters get-credentials test

log Pushing images
gcloud docker -- push eu.gcr.io/${PROJECT_NAME}/lumen-client
log Pushing images done
