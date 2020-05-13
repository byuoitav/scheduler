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

func sendHelpRequest() error {
	id := localsystem.MustSystemID()
	deviceInfo := events.GenerateBasicDeviceInfo(id)
	roomInfo := events.GenerateBasicRoomInfo(deviceInfo.RoomID)
	messenger, err := messenger.BuildMessenger(os.Getenv("HUB_ADDRESS"), base.Messenger, 1000)
	if err != nil {
		return err
	}

	var countEvent events.Event
	countEvent.GeneratingSystem = id
	countEvent.Timestamp = time.Now()
	countEvent.EventTags = []string{events.DetailState}
	countEvent.TargetDevice = deviceInfo
	countEvent.AffectedRoom = roomInfo
	countEvent.Key = "help-request"
	countEvent.Value = "confirm"

	if messenger != nil {
		messenger.SendEvent(countEvent)
		return nil
	}
	return fmt.Errorf("messenger not set up")
}
