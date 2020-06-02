#!/bin/bash

set -ex

function build {
  version=${1:-latest}

  rm -rf build/

  ./gradlew build --no-daemon -PskipTests

  docker build -t nimak/spinnaker-deck:$version -f Dockerfile.slim .
}

function push {
  version=${1:-latest}
  docker push nimak/spinnaker-deck:$version
}

function delete {
  kubectl delete pod -nspinnaker $(kubectl get pods -n spinnaker | grep deck | awk '{print $1}')
}

case "$1" in
  build )
    build $2
    ;;

  push )
    push $2
    ;;

  delete )
    delete
    ;;

  run )
    docker stop deck || true
    docker run -p 9000:9000 --rm --name deck -d nimak/spinnaker-deck:latest
    ;;

  * )
    build
    push
    delete
esac
