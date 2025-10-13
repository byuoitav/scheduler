package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/byuoitav/common/v2/events"
	"github.com/byuoitav/scheduler/calendars"
	"github.com/byuoitav/scheduler/log"
	"github.com/byuoitav/scheduler/schedule"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

var lastRequest time.Time

// GetConfig returns the config for this device, based on its SYSTEM_ID
func GetConfig(c *gin.Context) {
	id := os.Getenv("SYSTEM_ID")
	log.P.Debug("GetConfig handler called", zap.String("SYSTEM_ID", id), zap.String("client_ip", c.ClientIP()))
	if len(id) == 0 {
		log.P.Error("SYSTEM_ID is not set", zap.String("client_ip", c.ClientIP()))
		c.String(http.StatusInternalServerError, "SYSTEM_ID is not set")
		return
	}
	split := strings.Split(id, "-")
	if len(split) != 3 {
		log.P.Error("Invalid SYSTEM_ID format", zap.String("SYSTEM_ID", id), zap.String("client_ip", c.ClientIP()))
		c.String(http.StatusInternalServerError, fmt.Sprintf("invalid SYSTEM_ID %q", id))
		return
	}

	config, err := schedule.GetConfig(c.Request.Context(), split[0]+"-"+split[1])
	if err != nil {
		log.P.Error("Failed to get config", zap.Error(err), zap.String("SYSTEM_ID", id), zap.String("client_ip", c.ClientIP()))
		c.String(http.StatusInternalServerError, err.Error())
		return
	}

	lastRequest = time.Now()
	log.P.Debug("Config returned successfully", zap.String("SYSTEM_ID", id), zap.String("client_ip", c.ClientIP()))
	c.JSON(http.StatusOK, config)
}

// GetBackgroundImg retrieves the background image for the device based on its SYSTEM_ID
func GetBackgroundImg(c *gin.Context) {
	id := os.Getenv("SYSTEM_ID")
	log.P.Debug("GetBackgroundImg handler called", zap.String("SYSTEM_ID", id), zap.String("client_ip", c.ClientIP()))
	if len(id) == 0 {
		log.P.Error("SYSTEM_ID is not set", zap.String("client_ip", c.ClientIP()))
		c.String(http.StatusInternalServerError, "SYSTEM_ID is not set")
		return
	}

	split := strings.Split(id, "-")
	if len(split) != 3 {
		log.P.Error("Invalid SYSTEM_ID format", zap.String("SYSTEM_ID", id), zap.String("client_ip", c.ClientIP()))
		c.String(http.StatusInternalServerError, fmt.Sprintf("invalid SYSTEM_ID %q", id))
		return
	}

	imgBytes, err := schedule.GetBackgroundImage(c.Request.Context(), split[0]+"-"+split[1])
	if err != nil {
		log.P.Error("Failed to get background image", zap.Error(err), zap.String("SYSTEM_ID", id), zap.String("client_ip", c.ClientIP()))
		c.String(http.StatusInternalServerError, err.Error())
		return
	}

	lastRequest = time.Now()
	log.P.Debug("Background image returned successfully", zap.String("SYSTEM_ID", id), zap.String("client_ip", c.ClientIP()))
	c.Header("Content-Type", "image/png")
	c.Header("Cache-Control", "no-cache")
	c.Data(http.StatusOK, "image/png", imgBytes)
}

func GetEvents(c *gin.Context) {
	roomID := c.Param("roomID")
	log.P.Debug("GetEvents handler called", zap.String("roomID", roomID), zap.String("client_ip", c.ClientIP()))

	eventsList, err := schedule.GetEvents(c.Request.Context(), roomID)
	if err != nil {
		log.P.Error("Failed to get events", zap.Error(err), zap.String("roomID", roomID), zap.String("client_ip", c.ClientIP()))
		c.String(http.StatusInternalServerError, fmt.Sprintf("unable to get events in %q: %s", roomID, err))
		return
	}

	lastRequest = time.Now()
	log.P.Debug("Events returned successfully", zap.String("roomID", roomID), zap.String("client_ip", c.ClientIP()), zap.Int("event_count", len(eventsList)))
	c.JSON(http.StatusOK, eventsList)
}

func CreateEvent(c *gin.Context) {
	roomID := c.Param("roomID")
	log.P.Debug("CreateEvent handler called", zap.String("roomID", roomID), zap.String("client_ip", c.ClientIP()))

	var event calendars.Event
	if err := c.ShouldBindJSON(&event); err != nil {
		log.P.Error("Failed to bind event JSON", zap.Error(err), zap.String("roomID", roomID), zap.String("client_ip", c.ClientIP()))
		c.String(http.StatusBadRequest, err.Error())
		return
	}

	if err := schedule.CreateEvent(c.Request.Context(), roomID, event); err != nil {
		log.P.Error("Failed to create event", zap.Error(err), zap.String("roomID", roomID), zap.String("event_title", event.Title), zap.String("client_ip", c.ClientIP()))
		c.String(http.StatusInternalServerError, fmt.Sprintf("unable to create event %q in %q: %s", event.Title, roomID, err))
		return
	}

	log.P.Debug("Event created successfully", zap.String("roomID", roomID), zap.String("event_title", event.Title), zap.String("client_ip", c.ClientIP()))
	c.JSON(http.StatusOK, fmt.Sprintf("Successfully created %q in %q", event.Title, roomID))
}

func GetStaticElements(c *gin.Context) {
	docName := c.Param("doc")
	log.P.Debug("GetStaticElements handler called", zap.String("doc", docName), zap.String("client_ip", c.ClientIP()))

	file, fileType, err := schedule.GetStatic(c.Request.Context(), docName)
	if err != nil {
		log.P.Error("Unable to get static element", zap.Error(err), zap.String("doc", docName), zap.String("client_ip", c.ClientIP()))
		c.String(http.StatusInternalServerError, "unable to get static element")
		return
	}
	defer file.Close()

	log.P.Debug("Static element returned successfully", zap.String("doc", docName), zap.String("client_ip", c.ClientIP()))
	c.DataFromReader(http.StatusOK, -1, fileType, file, nil)
}

func SendHelpRequest(c *gin.Context) {
	log.P.Debug("SendHelpRequest handler called", zap.String("client_ip", c.ClientIP()))
	var request schedule.HelpRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		log.P.Error("Failed to bind help request JSON", zap.Error(err), zap.String("client_ip", c.ClientIP()))
		c.String(http.StatusBadRequest, err.Error())
		return
	}

	id := os.Getenv("SYSTEM_ID")
	deviceInfo := events.GenerateBasicDeviceInfo(id)
	roomInfo := events.GenerateBasicRoomInfo(deviceInfo.RoomID)

	event := events.Event{
		GeneratingSystem: id,
		Timestamp:        time.Now(),
		EventTags:        []string{events.DetailState},
		TargetDevice:     deviceInfo,
		AffectedRoom:     roomInfo,
		Key:              "help-request",
		Value:            "confirm",
	}

	sendEvent(c.Request.Context(), event)
	log.P.Debug("Help request sent successfully", zap.String("device_id", request.DeviceID), zap.String("client_ip", c.ClientIP()))
	c.JSON(http.StatusOK, fmt.Sprintf("Help request sent for device: %s", request.DeviceID))
}

func SendWebsocketCount(frequency time.Duration) {
	id := os.Getenv("SYSTEM_ID")
	deviceInfo := events.GenerateBasicDeviceInfo(id)
	roomInfo := events.GenerateBasicRoomInfo(deviceInfo.RoomID)

	ticker := time.NewTicker(frequency)
	defer ticker.Stop()

	for range ticker.C {
		event := events.Event{
			GeneratingSystem: id,
			Timestamp:        time.Now(),
			EventTags:        []string{events.DetailState},
			TargetDevice:     deviceInfo,
			AffectedRoom:     roomInfo,
			Key:              "websocket-count",
		}

		if time.Since(lastRequest).Seconds() >= 120 {
			event.Value = strconv.Itoa(0)
		} else {
			event.Value = strconv.Itoa(1)
		}

		sendEvent(context.Background(), event)
	}
}

func sendEvent(ctx context.Context, event events.Event) {
	eventProcs := strings.Split(os.Getenv("EVENT_URLS"), ",")

	body, err := json.Marshal(event)
	if err != nil {
		log.P.Warn("unable to marshal event", zap.Error(err))
		return
	}

	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	wg := &sync.WaitGroup{}

	for i := range eventProcs {
		if len(eventProcs[i]) == 0 {
			continue
		}

		wg.Add(1)

		go func(url string) {
			log.P.Debug("Sending event", zap.String("url", url), zap.String("key", event.Key), zap.String("value", event.Value))
			defer wg.Done()

			req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
			if err != nil {
				log.P.Warn("unable to create request", zap.Error(err), zap.String("url", url))
				return
			}

			req.Header.Add("content-type", "application/json")

			resp, err := http.DefaultClient.Do(req)
			if err != nil {
				log.P.Warn("unable to send request", zap.Error(err), zap.String("url", url))
				return
			}
			defer resp.Body.Close()

			if resp.StatusCode/100 != 2 {
				log.P.Warn("non 200 response", zap.String("url", url), zap.Int("statusCode", resp.StatusCode))
				return
			}
		}(eventProcs[i])
	}

	wg.Wait()
}
