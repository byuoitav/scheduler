package handlers

import (
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/byuoitav/scheduler/calendars"
	"github.com/byuoitav/scheduler/log"
	"github.com/byuoitav/scheduler/schedule"
	"github.com/labstack/echo"
	"go.uber.org/zap"
)

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

	return c.JSON(http.StatusOK, config)
}

func GetEvents(c echo.Context) error {
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

	return c.String(http.StatusOK, fmt.Sprintf("Successfully created %q in %q", event.Title, roomID))
}
