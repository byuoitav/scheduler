package handlers

import (
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/byuoitav/central-event-system/hub/base"
	"github.com/byuoitav/central-event-system/messenger"
	"github.com/byuoitav/common/v2/events"
	"github.com/byuoitav/device-monitoring/localsystem"
	"github.com/byuoitav/scheduler/calendars"
	"github.com/byuoitav/scheduler/log"
	"github.com/byuoitav/scheduler/schedule"
	"github.com/labstack/echo"
	"go.uber.org/zap"
)

var start time.Time

// GetConfig returns the config for this device, based on it's SYSTEM_ID
func GetConfig(c echo.Context) error {
	id := os.Getenv("SYSTEM_ID")
	if len(id) == 0 {
		return c.String(http.StatusInternalServerError, "SYSTEM_ID is not set")
	}

	split := strings.Split(id, "-")
	if len(split) != 3 {
		return c.String(http.StatusInternalServerError, fmt.Sprintf("invalid SYSTEM_ID %q", id))
	}

	config, err := schedule.GetConfig(c.Request().Context(), split[0]+"-"+split[1])
	if err != nil {
		return c.String(http.StatusInternalServerError, err.Error())
	}
	start = time.Now()
	go connectionCheck()

	return c.JSON(http.StatusOK, config)
}

func GetEvents(c echo.Context) error {
	start = time.Now()
	roomID := c.Param("roomID")

	log.P.Info("Getting events", zap.String("room", roomID))

	events, err := schedule.GetEvents(c.Request().Context(), roomID)
	if err != nil {
		return c.String(http.StatusInternalServerError, fmt.Sprintf("unable to get events in %q: %s", roomID, err))
	}

	return c.JSON(http.StatusOK, events)
}

func CreateEvent(c echo.Context) error {
	roomID := c.Param("roomID")

	var event calendars.Event
	if err := c.Bind(&event); err != nil {
		return c.String(http.StatusBadRequest, err.Error())
	}

	if err := schedule.CreateEvent(c.Request().Context(), roomID, event); err != nil {
		return c.String(http.StatusInternalServerError, fmt.Sprintf("unable to create event %q in %q: %s", event.Title, roomID, err))
	}

	return c.JSON(http.StatusOK, fmt.Sprintf("Successfully created %q in %q", event.Title, roomID))
}

func GetStaticElements(c echo.Context) error {
	docName := c.Param("doc")

	file, fileType, err := schedule.GetStatic(c.Request().Context(), docName)
	if err != nil {
		log.P.Error("Unable to get static element", zap.Error(err))
		return c.String(http.StatusInternalServerError, fmt.Sprintf("unable to get static element"))
	}
	defer file.Close()

	return c.Stream(http.StatusOK, fileType, file)
}

func SendHelpRequest(c echo.Context) error {

	var request schedule.HelpReqeust
	if err := c.Bind(&request); err != nil {
		return c.String(http.StatusBadRequest, err.Error())
	}

	if err := schedule.SendHelpRequest(request); err != nil {
		return c.String(http.StatusInternalServerError, fmt.Sprintf("failed to send help request for device: %s", request.DeviceID))
	}

	return c.JSON(http.StatusOK, fmt.Sprintf("Help request sent for device: %s", request.DeviceID))
}

func connectionCheck() {
	id := localsystem.MustSystemID()
	deviceInfo := events.GenerateBasicDeviceInfo(id)
	roomInfo := events.GenerateBasicRoomInfo(deviceInfo.RoomID)
	messenger, err := messenger.BuildMessenger(os.Getenv("HUB_ADDRESS"), base.Messenger, 1000)
	if err != nil {
		log.P.Error("unable to build websocket count messenger: %s", zap.String("error", err.Error()))
	}
	for {
		var countEvent events.Event
		log.P.Debug("Time since start", zap.String("time", time.Since(start).String()))
		if time.Since(start).Seconds() > 120 {
			//time to worry
			countEvent.GeneratingSystem = id
			countEvent.Timestamp = time.Now()
			countEvent.EventTags = []string{events.DetailState}
			countEvent.TargetDevice = deviceInfo
			countEvent.AffectedRoom = roomInfo
			countEvent.Key = "websocket-count"
			countEvent.Value = fmt.Sprintf("%d", 0)
		} else {
			countEvent.GeneratingSystem = id
			countEvent.Timestamp = time.Now()
			countEvent.EventTags = []string{events.DetailState}
			countEvent.TargetDevice = deviceInfo
			countEvent.AffectedRoom = roomInfo
			countEvent.Key = "websocket-count"
			countEvent.Value = fmt.Sprintf("%d", 1)
		}

		if messenger != nil {
			log.P.Debug("Sending websocket count of", zap.String("value", countEvent.Value))
			messenger.SendEvent(countEvent)
		}

		time.Sleep(3 * time.Minute)
	}

}
