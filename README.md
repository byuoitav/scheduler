# Scheduling Panel
Scheduler is the interface for the scheduling touchpanels

![Scheduling](https://github.com/user-attachments/assets/d005fc59-0259-4b43-818e-e637c39a5902)

## Custom Background Images
To change the default background image, upload an an image called "bg.png" as an attachment to the corresponding config file in couch. Images should be 800x480 to match the touchscreen displays and should be darkened to contrast against the information overlays.

Example (/schedulers/JET-1106):
```
{
  "_id": "JET-1106",
  "_rev": "29-7fdsfc79dd40823452a6b43dde9asdfed9",
  "displayName": "The JET",
  "canCreateEvents": true,
  "displayMeetingTitle": true,
  "calendarURL": "http://localhost:11002/JET_1106@calendar.com/events",
  "canRequestHelp": true,
  "_attachments": {
    "bg.png": {
      "content_type": "image/png",
      "revpos": 29,
      "digest": "md5-be43Nh1nPjU6lWIw3P14Tg==",
      "length": 498147,
      "stub": true
    }
  }
}
```
## Environment Variables:
| ENV Variable | Description                           |
|--------------|---------------------------------------|
|   SYSTEM_ID  |             JET-1100-SP1              |
|  DB_USERNAME |             couch username            |
|  DB_PASSWORD |             couch password            |
| DB_ADDRESS   | couch address (http://localhost:5984) |

## Endpoints:
| Endpoint           | Method | Description                                 |
|--------------------|--------|---------------------------------------------|
| /:roomID/events    | GET    | Get all events for a room                   |
| /:roomID/events    | POST   | Create a new event for a room               |
| /config            | GET    | Get config for the current device           |
| /background        | GET    | Get the background image for the device     |
| /static/:doc       | GET    | Get a static element (by doc name)          |
| /help              | POST   | Send a help request                         |
| /status            | GET    | Health check/status endpoint                |
| /log/:level        | GET    | Set the log level (debug, info, warn, etc.) |
| /web/*             | GET    | Serve static web assets and SPA             |
