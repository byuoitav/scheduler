package schedule

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"

	"github.com/byuoitav/scheduler/log"
	"go.uber.org/zap"
)

type Config struct {
	// couch doc stuff
	ID  string `json:"_id"`
	Rev string `json:"_rev"`

	// visual appearance
	DisplayName string `json:"displayName"`
	ImageURL    string `json:"image-url"`
	StyleURL    string `json:"style-url"`

	// functionality
	CanCreateEvents     bool `json:"canCreateEvents"`
	DisplayMeetingTitle bool `json:"displayMeetingTitle"`
	CanRequestHelp      bool `json:"canRequestHelp"`

	// how to get events - from one of our calendars (gsuite, exchange, etc.)
	CalendarURL string `json:"calendarURL"`
}

const (
	database = "schedulers"
)

func GetConfig(ctx context.Context, roomID string) (Config, error) {
	var config Config

	url := fmt.Sprintf("%s/%s/%s", os.Getenv("DB_ADDRESS"), database, roomID)
	log.P.Debug("Getting scheduler config", zap.String("room", roomID), zap.String("url", url))

	// build request
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return config, err
	}

	// add auth
	req.SetBasicAuth(os.Getenv("DB_USERNAME"), os.Getenv("DB_PASSWORD"))

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return config, err
	}
	defer resp.Body.Close()

	b, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return config, err
	}

	if resp.StatusCode/100 != 2 {
		return config, fmt.Errorf("bad response (%v): %s", resp.StatusCode, b)
	}

	if err := json.Unmarshal(b, &config); err != nil {
		return config, err
	}

	return config, nil
}

// GetBackgroundImage retrieves the background image for a given room ID.
func GetBackgroundImage(ctx context.Context, roomID string) ([]byte, error) {
	url := fmt.Sprintf("%s/%s/%s/bg.png", os.Getenv("DB_ADDRESS"), database, roomID)
	log.P.Debug("Getting background image", zap.String("room", roomID), zap.String("url", url))

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}

	req.SetBasicAuth(os.Getenv("DB_USERNAME"), os.Getenv("DB_PASSWORD"))

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, fmt.Errorf("background image not found for room %s", roomID)
	}

	if resp.StatusCode/100 != 2 {
		body, _ := ioutil.ReadAll(resp.Body)
		return nil, fmt.Errorf("failed to fetch bg.png: %s (status: %d)", body, resp.StatusCode)
	}

	return ioutil.ReadAll(resp.Body)
}
