#!/bin/bash

set -e

docker build -f deploy/docker/base/Dockerfile -t spark-base:latest .
docker build -f deploy/docker/spark-master/Dockerfile -t spark-master:latest .
docker build -f deploy/docker/spark-worker/Dockerfile -t spark-worker:latest .
docker build -f deploy/docker/spark-submit/Dockerfile -t spark-submit:latest .