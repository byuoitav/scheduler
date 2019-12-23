package calendars

import (
	"context"
	"net/http"
	"sync"
	"time"

	"github.com/labstack/echo"
)

type Event struct {
	Title     string    `json:"title"`
	StartTime time.Time `json:"startTime"`
	EndTime   time.Time `json:"endTime"`
}

type Calendar interface {
	GetEvents(context.Context) ([]Event, error)
	CreateEvent(context.Context, Event) error
}

type CreateCalendarFunc func(context.Context, string) (Calendar, error)

func CreateCalendarServer(create CreateCalendarFunc) Server {
	e := newEchoServer()
	m := &sync.Map{}

	createCal := func(ctx context.Context, roomID string) (Calendar, error) {
		if cal, ok := m.Load(roomID); ok {
			return cal.(Calendar), nil
		}

		cal, err := create(ctx, roomID)
		if err != nil {
			return nil, err
		}

		m.Store(roomID, cal)
		return cal, nil
	}

	e.GET("/events/:roomID", func(c echo.Context) error {
		roomID := c.Param("roomID")
		if len(roomID) == 0 {
			return c.String(http.StatusBadRequest, "must include roomID")
		}

		cal, err := createCal(c.Request().Context(), roomID)
		if err != nil {
			return c.String(http.StatusInternalServerError, err.Error())
		}

		events, err := cal.GetEvents(c.Request().Context())
		if err != nil {
			return c.String(http.StatusInternalServerError, err.Error())
		}

		return c.JSON(http.StatusOK, events)
	})

	e.POST("/events/:roomID", func(c echo.Context) error {
		roomID := c.Param("roomID")
		if len(roomID) == 0 {
			return c.String(http.StatusBadRequest, "must include roomID")
		}

		var event Event
		if err := c.Bind(&event); err != nil {
			return c.String(http.StatusBadRequest, err.Error())
		}

		cal, err := createCal(c.Request().Context(), roomID)
		if err != nil {
			return c.String(http.StatusInternalServerError, err.Error())
		}

		if err := cal.CreateEvent(c.Request().Context(), event); err != nil {
			return c.String(http.StatusInternalServerError, err.Error())
		}

		return c.String(http.StatusOK, "event successfully created")
	})

	return wrapEchoServer(e)
}
