FROM rabbitmq:3.7.7-management

RUN rabbitmq-plugins enable --offline rabbitmq_web_stomp

COPY rabbitmq.config /etc/rabbitmq/
COPY setup.json /etc/rabbitmq/
EXPOSE 5671
EXPOSE 5672
EXPOSE 15670
EXPOSE 15672
EXPOSE 15674
EXPOSE 61613
EXPOSE 61614

CMD ["rabbitmq-server"]

