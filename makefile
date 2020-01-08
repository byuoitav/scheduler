NAME := scheduler
OWNER := byuoitav
PKG := github.com/${OWNER}/${NAME}
DOCKER_URL := docker.pkg.github.com

# version:
# use the git tag, if this commit
# doesn't have a tag, use the git hash
VERSION := $(shell git rev-parse HEAD)
ifneq ($(shell git describe --exact-match --tags HEAD 2> /dev/null),)
	VERSION = $(shell git describe --exact-match --tags HEAD)
endif

# go stuff
PKG_LIST := $(go list ${PKG}/...)

# docker stuff
IMAGE := ${DOCKER_URL}/${OWNER}/${NAME}:${VERSION}

.PHONY: all deps deploy docker-linux-amd64 docker-linux-arm

all: clean deps dist/${NAME}-linux-amd64

deps:
	@go mod download

docker-linux-amd64: dist/${NAME}-linux-amd64 dist/web-dist
	@echo Building container ${IMAGE}-linux-amd64
	@cp dist/${NAME}-linux-amd64 dist/${NAME}
	@docker build -f dockerfile -t ${IMAGE}-linux-amd64 dist
	@rm -f dist/${NAME}

docker-linux-arm: dist/${NAME}-linux-arm dist/web-dist
	@echo Building container ${IMAGE}-linux-arm
	@cp dist/${NAME}-linux-arm dist/${NAME}
	@docker build -f dockerfile -t ${IMAGE}-linux-arm dist
	@rm -f dist/${NAME}

deploy: docker-linux-amd64 docker-linux-arm
	@echo Logging into Github Package Registry
	@docker login ${DOCKER_URL} -u ${DOCKER_USERNAME} -p ${DOCKER_PASSWORD}

	@echo Pushing container ${IMAGE}-linux-amd64
	@docker push ${IMAGE}-linux-amd64

	@echo Pushing container ${IMAGE}-linux-arm
	@docker push ${IMAGE}-linux-arm

dist/web-dist:
	@cd web && npm install && ng build --prod --aot --build-optimizer
	@mkdir -p dist
	@mv web/dist dist/web-dist

clean:
	@go clean
	@rm -rf dist/

dist/${NAME}-linux-amd64:
	@echo Building go binary for linux/amd64
	@mkdir -p dist
	@env CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -v -o dist/${NAME}-linux-amd64 ${PKG}

dist/${NAME}-linux-arm:
	@echo Building go binary for linux/arm
	@mkdir -p dist
	@env CGO_ENABLED=0 GOOS=linux GOARCH=arm go build -v -o dist/${NAME}-linux-arm ${PKG}
