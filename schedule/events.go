package schedule

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"sort"

	"github.com/byuoitav/scheduler/calendars"
	"github.com/byuoitav/scheduler/log"
	"go.uber.org/zap"
)

func GetEvents(ctx context.Context, roomID string) ([]calendars.Event, error) {
	var events []calendars.Event

	// get config for this room
	config, err := GetConfig(ctx, roomID)
	if err != nil {
		return events, fmt.Errorf("unable to get schedule config: %w", err)
	}

	log.P.Info("Getting events", zap.String("room", roomID), zap.String("url", config.CalendarURL))

	// build request
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, config.CalendarURL, nil)
	if err != nil {
		return events, fmt.Errorf("unable to build events request: %w", err)
	}

	// make http request
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return events, fmt.Errorf("unable to make events request: %w", err)
	}
	defer resp.Body.Close()

	// read response
	b, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return events, fmt.Errorf("unable to read response from calendar: %w", err)
	}

	if resp.StatusCode/100 != 2 {
		return events, fmt.Errorf("bad response from calendar (%v): %s", resp.StatusCode, b)
	}

	// parse response
	if err := json.Unmarshal(b, &events); err != nil {
		return events, fmt.Errorf("unable to parse response from calendar: %w. response body: %s", err, b)
	}

	// sort events by start time
	sort.Slice(events, func(i, j int) bool {
		return events[i].StartTime.Before(events[j].StartTime)
	})

	// when display title is false, set all meeting titles to empty string
	if !config.DisplayMeetingTitle {
		for _, event := range events {
			event.Title = ""
		}
	}

	return events, nil
}

func CreateEvent(ctx context.Context, roomID string, event calendars.Event) error {
	// get config for this room
	config, err := GetConfig(ctx, roomID)
	if err != nil {
		return fmt.Errorf("unable to get schedule config: %w", err)
	}

	requestBody, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("unable to marshal event into json: %w", err)
	}

	// build request
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, config.CalendarURL, bytes.NewBuffer(requestBody))
	if err != nil {
		return fmt.Errorf("unable to build event request: %w", err)
	}
	req.Header.Set("Content-type", "application/json")

	// make http request
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("unable to make event request: %w", err)
	}
	defer resp.Body.Close()

	// handle a non-2xx response
	if resp.StatusCode/100 != 2 {
		// read response
		b, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			return fmt.Errorf("bad response (%v). unable to read response body: %w", resp.StatusCode, err)
		}

		return fmt.Errorf("bad response (%v): %s", resp.StatusCode, b)
	}

	return nil
}
