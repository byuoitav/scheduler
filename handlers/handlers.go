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
func GetConfigGin(c *gin.Context) {
	id := os.Getenv("SYSTEM_ID")
	if len(id) == 0 {
		c.String(http.StatusInternalServerError, "SYSTEM_ID is not set")
		return
	}

	split := strings.Split(id, "-")
	if len(split) != 3 {
		c.String(http.StatusInternalServerError, fmt.Sprintf("invalid SYSTEM_ID %q", id))
		return
	}

	config, err := schedule.GetConfig(c.Request.Context(), split[0]+"-"+split[1])
	if err != nil {
		c.String(http.StatusInternalServerError, err.Error())
		return
	}

	lastRequest = time.Now()
	c.JSON(http.StatusOK, config)
}

func GetEventsGin(c *gin.Context) {
	roomID := c.Param("roomID")

	log.P.Debug("Getting events", zap.String("room", roomID))

	eventsList, err := schedule.GetEvents(c.Request.Context(), roomID)
	if err != nil {
		c.String(http.StatusInternalServerError, fmt.Sprintf("unable to get events in %q: %s", roomID, err))
		return
	}

	lastRequest = time.Now()
	c.JSON(http.StatusOK, eventsList)
}

func CreateEventGin(c *gin.Context) {
	roomID := c.Param("roomID")

	var event calendars.Event
	if err := c.ShouldBindJSON(&event); err != nil {
		c.String(http.StatusBadRequest, err.Error())
		return
	}

	if err := schedule.CreateEvent(c.Request.Context(), roomID, event); err != nil {
		c.String(http.StatusInternalServerError, fmt.Sprintf("unable to create event %q in %q: %s", event.Title, roomID, err))
		return
	}

	c.JSON(http.StatusOK, fmt.Sprintf("Successfully created %q in %q", event.Title, roomID))
}

func GetStaticElementsGin(c *gin.Context) {
	docName := c.Param("doc")

	file, fileType, err := schedule.GetStatic(c.Request.Context(), docName)
	if err != nil {
		log.P.Error("Unable to get static element", zap.Error(err))
		c.String(http.StatusInternalServerError, "unable to get static element")
		return
	}
	defer file.Close()

	c.DataFromReader(http.StatusOK, -1, fileType, file, nil)
}

func SendHelpRequestGin(c *gin.Context) {
	var request schedule.HelpRequest
	if err := c.ShouldBindJSON(&request); err != nil {
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
			log.P.Info("Sending event", zap.String("url", url), zap.String("key", event.Key), zap.String("value", event.Value))
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
