package main

import (
	"context"
	"fmt"
	"net"
	"os"

	"github.com/byuoitav/scheduler/calendars"
	"github.com/byuoitav/teamup-calendar"
	"github.com/spf13/pflag"
)

func main() {
	// parse flags
	var port int

	pflag.IntVarP(&port, "port", "p", 8080, "port to run the server on")
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
		return &teamup.Calendar{
			APIKey:     os.Getenv("TEAMUP_API_KEY"),
			Password:   os.Getenv("TEAMUP_PASSWORD"),
			CalendarID: os.Getenv("CALENDAR_ID"),
			RoomID:     roomID,
		}, nil
	}

	server := calendars.CreateCalendarServer(create)
	if err = server.Serve(lis); err != nil {
		fmt.Printf("error while listening: %s\n", err)
		os.Exit(1)
	}
}
