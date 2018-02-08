#!/usr/bin/env bash
set -e

function log {
   echo "$(date +"%T") - INFO - $*"
}

export PROJECT_NAME=akvo-lumen

if [ -z "$TRAVIS_COMMIT" ]; then
    export TRAVIS_COMMIT=local
fi

./ci/helpers/build-backend.sh &> backend.build.log &
BACKEND_PROCESS=$!
./ci/helpers/build-frontend.sh

wait ${BACKEND_PROCESS}
BACKEND_PROCESS_EXIT=$?
cat backend.build.log

if [ ${BACKEND_PROCESS_EXIT} -ne 0 ]; then
    exit ${BACKEND_PROCESS_EXIT}
fi

log Creating Production Windshaft image
docker build --rm=false -t eu.gcr.io/${PROJECT_NAME}/lumen-maps:${TRAVIS_COMMIT} ./windshaft
docker tag eu.gcr.io/${PROJECT_NAME}/lumen-maps:${TRAVIS_COMMIT} eu.gcr.io/${PROJECT_NAME}/lumen-maps:develop

log Starting Docker Compose environment
docker-compose -p akvo-lumen-ci -f docker-compose.yml -f docker-compose.ci.yml up --no-color -d --build

bash ci/helpers/wait-for-docker-compose-to-start.sh

log Running Backend functional tests
docker-compose -p akvo-lumen-ci -f docker-compose.yml -f docker-compose.ci.yml run --no-deps backend-functional-tests /app/import-and-run.sh functional-and-seed

log Running the end to end tests against local Docker Compose Environment
./ci/e2e-test.sh script-test akvolumenci http://t1.lumen.local/

log Done
#docker-compose -p akvo-lumen-ci -f docker-compose.yml -f docker-compose.ci.yml down
