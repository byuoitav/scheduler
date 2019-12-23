package schedule

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"sort"

	"github.com/byuoitav/scheduler/calendars"
)

func GetEvents(ctx context.Context, roomID string) ([]calendars.Event, error) {
	var events []calendars.Event

	// get config for this room
	config, err := GetConfig(ctx, roomID)
	if err != nil {
		return events, fmt.Errorf("unable to get schedule config: %w", err)
	}

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

	// parse response
	if err := json.Unmarshal(b, &events); err != nil {
		return events, fmt.Errorf("unable to parse response from calendar: %w. response body: %s", err, b)
	}

	// sort events by start time
	sort.Slice(events, func(i, j int) bool {
		return events[i].StartTime.Before(events[j].StartTime)
	})

	return events, nil
}

func CreateEvent(ctx context.Context, roomID string, event calendars.Event) error {
	// get config for this room
	config, err := GetConfig(ctx, roomID)
	if err != nil {
		return fmt.Errorf("unable to get schedule config: %w", err)
	}

	// build request
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, config.CalendarURL, nil)
	if err != nil {
		return fmt.Errorf("unable to build event request: %w", err)
	}

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
