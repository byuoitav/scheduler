package main

import (
	"context"
	"errors"
	"fmt"
	"net"
	"net/url"
	"os"

	"github.com/byuoitav/gsuite-calendar"
	"github.com/byuoitav/scheduler/calendars"
	"github.com/spf13/pflag"
)

func main() {
	// parse flags
	var port int

	pflag.IntVarP(&port, "port", "p", 11001, "port to run the server on")
	pflag.Parse()

	// bind to given port
	addr := fmt.Sprintf(":%d", port)
	lis, err := net.Listen("tcp", addr)
	if err != nil {
		fmt.Printf("failed to start server: %s\n", err)
		os.Exit(1)
	}

	create := func(ctx context.Context, roomID string) (calendars.Calendar, error) {
		// TODO add logic to make sure they are set?
		urlDecodedRoomID, err := url.QueryUnescape(roomID)
		if err != nil {
			//Idk
		}

		cal := &gsuite.Calendar{
			UserEmail:       os.Getenv("G_SUITE_EMAIL"),
			CredentialsPath: os.Getenv("G_SUITE_CREDENTIALS"),
			RoomID:          urlDecodedRoomID,
		}

		switch {
		case len(cal.UserEmail) == 0:
			return nil, errors.New("G_SUITE_EMAIL not set")
		case len(cal.CredentialsPath) == 0:
			return nil, errors.New("G_SUITE_CREDENTIALS not set")
		case len(cal.RoomID) == 0:
			return nil, errors.New("roomID must be set")
		}

		return cal, nil
	}

	server := calendars.CreateCalendarServer(create)
	if err = server.Serve(lis); err != nil {
		fmt.Printf("error while listening: %s\n", err)
		os.Exit(1)
	}
}
