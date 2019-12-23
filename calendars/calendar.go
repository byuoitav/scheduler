package calendars

import (
	"context"
	"net/http"
	"sync"
	"time"

	"github.com/labstack/echo"
)

type Event interface {
	GetTitle() string
	GetStartTime() time.Time
	GetEndTime() time.Time
}

type jsonEvent struct {
	Title     string    `json:"title"`
	StartTime time.Time `json:"startTime"`
	EndTime   time.Time `json:"endTime"`
}

type Calendar interface {
	GetEvents(context.Context) ([]Event, error)
	CreateEvent(ctx context.Context, title string, startTime, endTime time.Time) error
}

type CreateCalendarFunc func(context.Context, string) (Calendar, error)

func CreateCalendarServer(create CreateCalendarFunc) (Server, error) {
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

		var je []jsonEvent
		for _, e := range events {
			je = append(je, jsonEvent{
				Title:     e.GetTitle(),
				StartTime: e.GetStartTime(),
				EndTime:   e.GetEndTime(),
			})
		}

		return c.JSON(http.StatusOK, je)
	})

	e.POST("/events/:roomID", func(c echo.Context) error {
		roomID := c.Param("roomID")
		if len(roomID) == 0 {
			return c.String(http.StatusBadRequest, "must include roomID")
		}

		var je jsonEvent
		if err := c.Bind(&je); err != nil {
			return c.String(http.StatusBadRequest, err.Error())
		}

		cal, err := createCal(c.Request().Context(), roomID)
		if err != nil {
			return c.String(http.StatusInternalServerError, err.Error())
		}

		if err := cal.CreateEvent(c.Request().Context(), je.Title, je.StartTime, je.EndTime); err != nil {
			return c.String(http.StatusInternalServerError, err.Error())
		}

		return c.String(http.StatusOK, "event successfully created")
	})

	return wrapEchoServer(e), nil
}
