package main

import (
	"context"
	"errors"
	"fmt"
	"net"
	"os"

	"github.com/byuoitav/exchange-calendar"
	"github.com/byuoitav/scheduler/calendars"
	"github.com/spf13/pflag"
)

func main() {
	// parse flags
	var port int

	pflag.IntVarP(&port, "port", "p", 11002, "port to run the server on")
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
		cal := &exchange.Calendar{
			ClientId:     os.Getenv("AZURE_AD_CLIENT_ID"),
			ClientSecret: os.Getenv("AZURE_AD_CLIENT_SECRET"),
			TennantId:    os.Getenv("AZURE_AD_TENNANT_ID"),
			RoomID:       roomID,
			RoomResource: "Test", // TODO find some way to get the resource into the struct
		}

		switch {
		case len(cal.ClientId) == 0:
			return nil, errors.New("AZURE_AD_CLIENT_ID not set")
		case len(cal.ClientSecret) == 0:
			return nil, errors.New("AZURE_AD_CLIENT_SECRET not set")
		case len(cal.TennantId) == 0:
			return nil, errors.New("AZURE_AD_TENNANT_ID not set")
		case len(cal.RoomID) == 0:
			return nil, errors.New("roomID must be set")
		case len(cal.RoomResource) == 0:
			return nil, errors.New("RoomResource must be set")
		}

		return cal, nil
	}

	server := calendars.CreateCalendarServer(create)
	if err = server.Serve(lis); err != nil {
		fmt.Printf("error while listening: %s\n", err)
		os.Exit(1)
	}
}
