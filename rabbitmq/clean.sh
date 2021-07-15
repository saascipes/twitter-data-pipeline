#!/usr/bin/env sh
docker rm $(docker stop rabbitmq)
docker rmi saasglue/rabbitmq:v1.0
