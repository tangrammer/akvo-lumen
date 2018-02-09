#!/usr/bin/env bash

set -eu

function log {
   echo "$(date +"%T") - INFO - $*"
}

export PROJECT_NAME=akvo-lumen

log Bulding container to run the backend tests
docker build --rm=false -t akvo-lumen-backend-dev:develop backend -f backend/Dockerfile-dev
docker tag akvo-lumen-backend-dev:develop eu.gcr.io/${PROJECT_NAME}/lumen-backend-dev:${TRAVIS_COMMIT}
log Running Backend unit tests and building uberjar
ls -lrt $HOME/.m2 || echo "No maven dir????"
docker run --env-file=.env -v "$HOME/.m2:/home/akvo/.m2" -v "$(pwd)/backend:/app" akvo-lumen-backend-dev:develop /app/run-as-user.sh lein "do" test, uberjar

cp backend/target/uberjar/akvo-lumen.jar backend

log Creating Production Backend image
docker build --rm=false -t eu.gcr.io/${PROJECT_NAME}/lumen-backend:${TRAVIS_COMMIT} ./backend
docker tag eu.gcr.io/${PROJECT_NAME}/lumen-backend:${TRAVIS_COMMIT} eu.gcr.io/${PROJECT_NAME}/lumen-backend:develop

#rm backend/akvo-lumen.jar

log Production Backend image built

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
gcloud docker -- push eu.gcr.io/${PROJECT_NAME}/lumen-backend
gcloud docker -- push eu.gcr.io/${PROJECT_NAME}/lumen-backend-dev