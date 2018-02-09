#!/usr/bin/env bash
set -e

function log {
   echo "$(date +"%T") - INFO - $*"
}

export PROJECT_NAME=akvo-lumen

if [ -z "$TRAVIS_COMMIT" ]; then
    export TRAVIS_COMMIT=local
fi

log Starting Docker Compose environment
docker-compose -p akvo-lumen-ci -f docker-compose.yml -f docker-compose.ci.yml up --no-color -d --build

bash ci/helpers/wait-for-docker-compose-to-start.sh

log Running Backend functional tests
docker-compose -p akvo-lumen-ci -f docker-compose.yml -f docker-compose.ci.yml run --no-deps backend-functional-tests /app/import-and-run.sh functional-and-seed

log Running the end to end tests against local Docker Compose Environment
./ci/e2e-test.sh script-test akvolumenci http://t1.lumen.local/

log Done
#docker-compose -p akvo-lumen-ci -f docker-compose.yml -f docker-compose.ci.yml down
