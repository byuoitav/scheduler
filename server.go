package main

import (
	"embed"
	"errors"
	"fmt"
	"io/fs"
	"net/http"
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
	var logLevelStr string

	pflag.IntVarP(&port, "port", "p", 80, "port to run the server on")
	pflag.StringVarP(&logLevelStr, "log-level", "l", "info", "level of logging wanted. debug, info, warn, error, panic")
	pflag.Parse()

	setLog := func(levelStr string) error {
		switch levelStr {
		case "debug":
			fmt.Printf("\nSetting log level to *debug*\n\n")
			log.Config.Level.SetLevel(zap.DebugLevel)
		case "info":
			fmt.Printf("\nSetting log level to *info*\n\n")
			log.Config.Level.SetLevel(zap.InfoLevel)
		case "warn":
			fmt.Printf("\nSetting log level to *warn*\n\n")
			log.Config.Level.SetLevel(zap.WarnLevel)
		case "error":
			fmt.Printf("\nSetting log level to *error*\n\n")
			log.Config.Level.SetLevel(zap.ErrorLevel)
		case "panic":
			fmt.Printf("\nSetting log level to *panic*\n\n")
			log.Config.Level.SetLevel(zap.PanicLevel)
		default:
			return errors.New("invalid log level: must be one of debug, info, warn, error, panic")
		}
		return nil
	}

	// set the initial log level
	if err := setLog(logLevelStr); err != nil {
		log.P.Fatal("unable to set log level", zap.Error(err), zap.String("got", logLevelStr))
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
		log.P.Debug("GET /:roomID/events", zap.String("roomID", c.Param("roomID")))
		if c.IsAborted() {
			log.P.Error("Request aborted before processing")
			c.String(http.StatusInternalServerError, "event retrieval request aborted before processing")
			return
		}
		handlers.GetEvents(c)
	})
	r.POST("/:roomID/events", func(c *gin.Context) {
		logRequestAndStatus(c, "POST /:roomID/events", zap.String("roomID", c.Param("roomID")))
		if c.IsAborted() {
			log.P.Error("Request aborted before processing")
			c.String(http.StatusInternalServerError, "event creation request aborted before processing")
			return
		}
		handlers.CreateEvent(c)
	})

	// get config for the room
	r.GET("/config", func(c *gin.Context) {
		logRequestAndStatus(c, "GET /config")
		if c.IsAborted() {
			log.P.Error("Request aborted before processing")
			c.String(http.StatusInternalServerError, "config request aborted before processing")
			return
		}
		handlers.GetConfig(c)
	})

	// get background image
	r.GET("/background", func(c *gin.Context) {
		logRequestAndStatus(c, "GET /background")
		if c.IsAborted() {
			log.P.Error("Request aborted before processing")
			c.String(http.StatusInternalServerError, "background image request aborted before processing")
			return
		}
		handlers.GetBackgroundImg(c)
	})

	// get static elements
	r.GET("/static/:doc", func(c *gin.Context) {
		logRequestAndStatus(c, "GET /static/:doc", zap.String("doc", c.Param("doc")))
		if c.IsAborted() {
			log.P.Error("Request aborted before processing")
			c.String(http.StatusInternalServerError, "static elements request aborted before processing")
			return
		}
		handlers.GetStaticElements(c)
	})

	// send help request
	r.POST("/help", func(c *gin.Context) {
		logRequestAndStatus(c, "POST /help")
		if c.IsAborted() {
			log.P.Error("Request aborted before processing")
			c.String(http.StatusInternalServerError, "help request aborted before processing")
			return
		}
		handlers.SendHelpRequest(c)
	})

	// handle load balancer status check
	r.GET("/status", func(c *gin.Context) {
		logRequestAndStatus(c, "GET /status")
		if c.IsAborted() {
			log.P.Error("Request aborted before processing")
			c.String(http.StatusInternalServerError, "status check request aborted before processing")
			return
		}
		c.String(http.StatusOK, "healthy")
	})

	// set the log level
	r.GET("/log/:level", func(c *gin.Context) {
		levelStr := c.Param("level")
		log.P.Info("GET /log/:level", zap.String("level", levelStr))
		if err := setLog(levelStr); err != nil {
			log.P.Error("Invalid log level string", zap.String("level", levelStr))
			c.String(http.StatusBadRequest, "invalid log level: must be one of debug, info, warn, error, panic")
			return
		}
		c.String(http.StatusOK, fmt.Sprintf("Set log level to %s", levelStr))
	})

	r.StaticFS("/web", http.FS(subFS))

	r.NoRoute(func(c *gin.Context) {
		if c.Request.URL.Path == "/" {
			c.Redirect(http.StatusFound, "/web/")
		} else if len(c.Request.URL.Path) >= 5 && c.Request.URL.Path[:5] == "/web/" {
			c.FileFromFS("index.html", http.FS(subFS))
		} else {
			c.String(http.StatusNotFound, "Not found")
			log.P.Error("404 Not Found", zap.String("path", c.Request.URL.Path))
		}
	})
	// i'm
	go handlers.SendWebsocketCount(3 * time.Minute)

	addr := fmt.Sprintf(":%d", port)
	err = r.Run(addr)
	if err != nil {
		log.P.Fatal("failed to start server", zap.Error(err))
	}
}

// Helper: log request and response status
func logRequestAndStatus(c *gin.Context, msg string, fields ...zap.Field) {
	c.Next() // process the handler
	status := c.Writer.Status()
	log.P.Info(msg, append(fields, zap.Int("status", status))...)
}
