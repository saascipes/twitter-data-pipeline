FROM spydernaz/spark-base:latest
COPY --from=saasglue/agent:v1.0 / /

COPY ./deploy/docker/spark-master/start-master.sh /

COPY ./deploy/docker/spark-master/sg-agent-launcher /
COPY ./deploy/docker/spark-master/sg.cfg /
COPY ./target/scala-2.11/lda-medium-assembly-1.0.jar /opt/spark-apps/

ENV SPARK_MASTER_PORT 7077
ENV SPARK_MASTER_WEBUI_PORT 8080
ENV SPARK_MASTER_LOG /spark/logs

RUN apt-get update && apt-get install -y python python-pip
RUN pip install awscli
RUN pip install pika==0.12.0

ENV NODE_VERSION=10.18.0
RUN apt install -y curl
RUN curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.34.0/install.sh | bash
ENV NVM_DIR=/root/.nvm
RUN . "$NVM_DIR/nvm.sh" && nvm install ${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm use v${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm alias default v${NODE_VERSION}
ENV PATH="/root/.nvm/versions/node/v${NODE_VERSION}/bin/:${PATH}"
RUN node --version
RUN npm --version

EXPOSE 8080 7077 6066

CMD ["/bin/bash", "/start-master.sh"]
