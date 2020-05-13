package schedule

import (
	"fmt"
	"os"
	"time"

	"github.com/byuoitav/central-event-system/hub/base"
	"github.com/byuoitav/central-event-system/messenger"
	"github.com/byuoitav/common/v2/events"
	"github.com/byuoitav/device-monitoring/localsystem"
)

type HelpReqeust struct {
	DeviceID string
}

func SendHelpRequest(request HelpReqeust) error {
	id := localsystem.MustSystemID()
	deviceInfo := events.GenerateBasicDeviceInfo(id)
	roomInfo := events.GenerateBasicRoomInfo(deviceInfo.RoomID)
	messenger, err := messenger.BuildMessenger(os.Getenv("HUB_ADDRESS"), base.Messenger, 1000)
	if err != nil {
		return err
	}

	if messenger != nil {
		messenger.SendEvent(events.Event{
			GeneratingSystem: id,
			Timestamp:        time.Now(),
			EventTags:        []string{events.DetailState},
			TargetDevice:     deviceInfo,
			AffectedRoom:     roomInfo,
			Key:              "help-request",
			Value:            "confirm",
		})
		return nil
	}
	return fmt.Errorf("messenger not set up")
}
