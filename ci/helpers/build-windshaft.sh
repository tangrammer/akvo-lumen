#!/usr/bin/env bash

function log {
   echo "$(date +"%T") - INFO - $*"
}

export PROJECT_NAME=akvo-lumen

if [ -z "$TRAVIS_COMMIT" ]; then
    export TRAVIS_COMMIT=local
fi

log Creating Production Windshaft image
docker build --rm=false -t eu.gcr.io/${PROJECT_NAME}/lumen-maps:${TRAVIS_COMMIT} ./windshaft
docker tag eu.gcr.io/${PROJECT_NAME}/lumen-maps:${TRAVIS_COMMIT} eu.gcr.io/${PROJECT_NAME}/lumen-maps:develop

log Done creating Production Windshaft image

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
gcloud docker -- push eu.gcr.io/${PROJECT_NAME}/lumen-maps
log Pushing images done

#docker-compose -p akvo-lumen-ci -f docker-compose.yml -f docker-compose.ci.yml down
