package schedule

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
)

type Config struct {
	// couch doc stuff
	ID  string `json:"_id"`
	Rev string `json:"_rev"`

	// visual appearance
	DisplayName   string `json:"displayname"`
	BackgroundURL string `json:"backgroundURL"`

	// functionality
	CanCreateEvents bool `json:"canCreateEvents"`

	// how to get events - from one of our calendars (gsuite, exchange, etc.)
	CalendarURL string `json:"calendarURL"`
}

const (
	database = "schedulers"
)

func GetConfig(ctx context.Context, roomID string) (Config, error) {
	var config Config

	url := fmt.Sprintf("%s/%s/%s", os.Getenv("DB_ADDRESS"), database, roomID)

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
