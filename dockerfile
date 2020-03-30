FROM gcr.io/distroless/static
MAINTAINER Daniel Randall <danny_randall@byu.edu>

COPY scheduler /scheduler
COPY web-dist/ /web-dist

ENTRYPOINT [ "/scheduler" ]
CMD ["-p", "80"]