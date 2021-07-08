FROM spydernaz/spark-base:latest

COPY ./deploy/docker/spark-submit/spark-submit.sh /

ENV SPARK_MASTER_URL="spark://spark-master:7077"
ENV SPARK_SUBMIT_ARGS=""
ENV SPARK_APPLICATION_ARGS ""


CMD ["/bin/bash", "/spark-submit.sh"]
