FROM alpine:3.23

ARG NAME
ENV name=${NAME}

COPY ${NAME} /app

ENTRYPOINT [ "/app", "-p", "8888" ]
