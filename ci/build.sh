#!/usr/bin/env bash
set -e

function log {
   echo "$(date +"%T") - INFO - $*"
}

export PROJECT_NAME=akvo-lumen

if [ -z "$TRAVIS_COMMIT" ]; then
    export TRAVIS_COMMIT=local
fi

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

gcloud docker -- pull eu.gcr.io/${PROJECT_NAME}/lumen-maps:${TRAVIS_COMMIT}
gcloud docker -- pull eu.gcr.io/${PROJECT_NAME}/lumen-client:${TRAVIS_COMMIT}
gcloud docker -- pull eu.gcr.io/${PROJECT_NAME}/lumen-backend:${TRAVIS_COMMIT}
gcloud docker -- pull eu.gcr.io/${PROJECT_NAME}/lumen-backend-dev:${TRAVIS_COMMIT}

log Starting Docker Compose environment
docker-compose -p akvo-lumen-ci -f docker-compose.yml -f docker-compose.ci.yml up --no-color -d --build

bash ci/helpers/wait-for-docker-compose-to-start.sh

log Running Backend functional tests
docker-compose -p akvo-lumen-ci -f docker-compose.yml -f docker-compose.ci.yml run --no-deps backend-functional-tests /app/import-and-run.sh functional-and-seed

log Running the end to end tests against local Docker Compose Environment
./ci/e2e-test.sh script-test akvolumenci http://t1.lumen.local/

log Done
#docker-compose -p akvo-lumen-ci -f docker-compose.yml -f docker-compose.ci.yml down
