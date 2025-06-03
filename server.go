package main

import (
	"embed"
	"errors"
	"fmt"
	"io/fs"
	"net/http"
	"strconv"
	"time"

	"github.com/byuoitav/scheduler/handlers"
	"github.com/byuoitav/scheduler/log"
	"github.com/gin-gonic/gin"
	"github.com/spf13/pflag"
	"go.uber.org/zap"
)

var (
	//go:embed web/*
	embeddedFiles embed.FS
)

func main() {
	var port int
	var logLevel int

	pflag.IntVarP(&port, "port", "p", 80, "port to run the server on")
	pflag.IntVarP(&logLevel, "log-level", "l", 2, "level of logging wanted. 1=DEBUG, 2=INFO, 3=WARN, 4=ERROR, 5=PANIC")
	pflag.Parse()

	setLog := func(level int) error {
		switch level {
		case 1:
			fmt.Printf("\nSetting log level to *debug*\n\n")
			log.Config.Level.SetLevel(zap.DebugLevel)
		case 2:
			fmt.Printf("\nSetting log level to *info*\n\n")
			log.Config.Level.SetLevel(zap.InfoLevel)
		case 3:
			fmt.Printf("\nSetting log level to *warn*\n\n")
			log.Config.Level.SetLevel(zap.WarnLevel)
		case 4:
			fmt.Printf("\nSetting log level to *error*\n\n")
			log.Config.Level.SetLevel(zap.ErrorLevel)
		case 5:
			fmt.Printf("\nSetting log level to *panic*\n\n")
			log.Config.Level.SetLevel(zap.PanicLevel)
		default:
			return errors.New("invalid log level: must be [1-4]")
		}

		return nil
	}

	// set the initial log level
	if err := setLog(logLevel); err != nil {
		log.P.Fatal("unable to set log level", zap.Error(err), zap.Int("got", logLevel))
	}

	// Setup the Frontend
	subFS, err := fs.Sub(embeddedFiles, "web")
	if err != nil {
		log.P.Fatal("failed to create sub filesystem for web files", zap.Error(err))
	}

	// build gin server
	r := gin.New()

	// get/create event
	r.GET("/:roomID/events", func(c *gin.Context) {
		log.P.Debug("GET /:roomID/events endpoint hit", zap.String("roomID", c.Param("roomID")))
		handlers.GetEvents(c)
	})
	r.POST("/:roomID/events", func(c *gin.Context) {
		log.P.Info("POST /:roomID/events endpoint hit", zap.String("roomID", c.Param("roomID")))
		handlers.CreateEvent(c)
	})

	// get config for the room
	r.GET("/config", func(c *gin.Context) {
		log.P.Info("GET /config endpoint hit")
		handlers.GetConfig(c)
	})

	// get background image
	r.GET("/background", func(c *gin.Context) {
		log.P.Info("GET /background endpoint hit")
		handlers.GetBackgroundImg(c)
	})

	// get static elements
	r.GET("/static/:doc", func(c *gin.Context) {
		log.P.Info("GET /static/:doc endpoint hit", zap.String("doc", c.Param("doc")))
		handlers.GetStaticElements(c)
	})

	// send help request
	r.POST("/help", func(c *gin.Context) {
		log.P.Info("POST /help endpoint hit")
		handlers.SendHelpRequest(c)
	})

	// handle load balancer status check
	r.GET("/status", func(c *gin.Context) {
		log.P.Info("GET /status endpoint hit")
		c.String(http.StatusOK, "healthy")
	})

	// set the log level
	r.GET("/log/:level", func(c *gin.Context) {
		log.P.Info("GET /log/:level endpoint hit", zap.String("level", c.Param("level")))
		level, err := strconv.Atoi(c.Param("level"))
		if err != nil {
			c.String(http.StatusBadRequest, err.Error())
			return
		}
		if err := setLog(level); err != nil {
			c.String(http.StatusBadRequest, err.Error())
			return
		}
		c.String(http.StatusOK, fmt.Sprintf("Set log level to %v", level))
	})

	r.StaticFS("/web", http.FS(subFS))

	r.NoRoute(func(c *gin.Context) {
		if c.Request.URL.Path == "/" {
			c.Redirect(http.StatusFound, "/web/")
		} else if len(c.Request.URL.Path) >= 5 && c.Request.URL.Path[:5] == "/web/" {
			c.FileFromFS("index.html", http.FS(subFS))
		} else {
			c.String(http.StatusNotFound, "Not found")
		}
	})

	go handlers.SendWebsocketCount(3 * time.Minute)

	addr := fmt.Sprintf(":%d", port)
	err = r.Run(addr)
	if err != nil {
		log.P.Fatal("failed to start server", zap.Error(err))
	}
}
