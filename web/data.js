// @ts-check
// ^ This enables type checking for vscode
/**
 * @typedef {Object} RoomStatusParams
 * @property {string} roomName
 * @property {string} deviceName
 * @property {boolean} unoccupied
 * @property {boolean} emptySchedule
 * @property {boolean} displayBookNow
 * @property {boolean} displayTitle
 * @property {boolean} displayHelp
 */

export class RoomStatus {
    /**
     * @param {RoomStatusParams} params
     */
    constructor(params) {
        this.roomName = params.roomName;
        this.deviceName = params.deviceName;
        this.unoccupied = params.unoccupied;
        this.emptySchedule = params.emptySchedule;
        this.displayBookNow = params.displayBookNow;
        this.displayTitle = params.displayTitle;
        this.displayHelp = params.displayHelp;
    }

    setRoomName(roomName) { this.roomName = roomName; }
    setDeviceName(deviceName) { this.deviceName = deviceName; }
    setUnoccupied(unoccupied) { this.unoccupied = unoccupied; }
    setEmptySchedule(emptySchedule) { this.emptySchedule = emptySchedule; }
    setDisplayBookNow(displayBookNow) { this.displayBookNow = displayBookNow; }
    setDisplayTitle(displayTitle) { this.displayTitle = displayTitle; }
    setDisplayHelp(displayHelp) { this.displayHelp = displayHelp; }

    getRoomName() { return this.roomName; }
    getDeviceName() { return this.deviceName; }
    getUnoccupied() { return this.unoccupied; }
    getEmptySchedule() { return this.emptySchedule; }
    getDisplayBookNow() { return this.displayBookNow; }
    getDisplayTitle() { return this.displayTitle; }
    getDisplayHelp() { return this.displayHelp; }
}

/**
 * @typedef {Object} EventParams
 * @property {string} title
 * @property {string} startTime
 * @property {string} endTime
 */

/**
 * @typedef {Object} HelpRequestParams
 * @property {string} roomId
 */

export class OutPutEvent {
    /**
     * @param {EventParams} params
     */
    constructor(params) {
        this.title = params?.title ?? "";
        this.startTime = params?.startTime ?? "";
        this.endTime = params?.endTime ?? "";
    }

    setTitle(title) { this.title = title; }
    setStartTime(startTime) { this.startTime = startTime; }
    setEndTime(endTime) { this.endTime = endTime; }

    getTitle() { return this.title; }
    getStartTime() { return this.startTime; }
    getEndTime() { return this.endTime; }
}

export class ScheduledEvent {
    /**
     * @param {EventParams} params
     */
    constructor(params) {
        this.title = params?.title ?? "";
        this.startTime = params?.startTime ?? "";
        this.endTime = params?.endTime ?? "";
    }

    setTitle(title) { this.title = title; }
    setStartTime(startTime) { this.startTime = startTime; }
    setEndTime(endTime) { this.endTime = endTime; }

    getTitle() { return this.title; }
    getStartTime() { return this.startTime; }
    getEndTime() { return this.endTime; }
}

export class HelpRequest {
    /**
     * @param {HelpRequestParams} params
     */
    constructor(params) {
        this.roomId = params?.roomId ?? "";
    }

    setRoomId(roomId) { this.roomId = roomId; }
    getRoomId() { return this.roomId; }
}


export class DataService {
    constructor() {
        const base = location.origin.split(":");
        this.url = base[0] + ":" + base[1];
        console.log(this.url);
        this.port = base[2] ?? "80";
        console.log(this.port);

        this.status = new RoomStatus({
            roomName: "",
            deviceName: "",
            unoccupied: true,
            emptySchedule: false,
            displayBookNow: true,
            displayTitle: true,
            displayHelp: true
        });

        this.currentSchedule = [];
        this.config = {};

        this.getConfig().then(() => {
            this.getScheduleData();
            setInterval(() => this.getScheduleData(), 30000);
            this.getCurrentEvent();
        });
    }

    getBackground() {
        if (
            this.config &&
            this.config.hasOwnProperty("image-url") &&
            this.config["image-url"] !== ""
        ) {
            return this.url + ":" + this.port + this.config["image-url"];
        }
        return "assets/bg.png";
    }

    getStylesheet() {
        if (
            this.config &&
            this.config.hasOwnProperty("style-url") &&
            this.config["style-url"] !== ""
        ) {
            return this.url + ":" + this.port + this.config["style-url"];
        }
        return "assets/custom.css";
    }

    getRoomStatus() { return this.status; }
    getSchedule() { return this.currentSchedule; }

    getCurrentEvent() {
        const time = new Date();

        if (!this.status.emptySchedule) {
            for (const event of this.currentSchedule) {
                const start = new Date(event.startTime);
                const end = new Date(event.endTime);
                if (time >= start && time < end) {
                    this.status.unoccupied = false;
                    return event;
                }
            }
        }

        this.status.unoccupied = true;
        return null;
    }

    getConfig() {
        console.log("Getting config...");

        return fetch("http://localhost/config")
            .then((res) => res.json())
            .then((data) => {
                this.config = data;
                console.log("config", this.config);
                this.status.setRoomName(this.config["displayName"] ?? "");
                this.status.setDeviceName(this.config["_id"] ?? "");
                this.status.setDisplayBookNow(this.config["canCreateEvents"] ?? true);
                this.status.setDisplayTitle(this.config["displayMeetingTitle"] ?? true);
                this.status.setDisplayHelp(this.config["canRequestHelp"] ?? true);
            })
            .catch((err) => {
                console.error("failed to get config", err);
                setTimeout(() => this.getConfig(), 5000);
            });
    }

    getScheduleData() {
        const url = `http://localhost:8000/${this.status.deviceName}/events`;
        console.log("Getting schedule data from:", url);

        fetch(url)
            .then((res) => res.json())
            .then((data) => {
                if (!data || data.length === 0) {
                    this.status.setEmptySchedule(true);
                } else {
                    this.status.setEmptySchedule(false);
                    this.currentSchedule = data.map(
                        (e) =>
                            new ScheduledEvent({
                                title: e.title,
                                startTime: new Date(e.startTime).toISOString(),
                                endTime: new Date(e.endTime).toISOString()
                            })
                    );
                }
                console.log("Schedule updated");
            })
            .catch((err) => {
                console.error("failed to get schedule data", err);
            });
    }

    /**
     * @param {ScheduledEvent} event
     */
    submitNewEvent(event) {
        const url = `http://localhost:8000/${this.status.deviceName}/events`;
        console.log("Submitting new event to", url);

        const body = new OutPutEvent({
            title: event.title,
            startTime: new Date(event.startTime).toISOString(),
            endTime: new Date(event.endTime).toISOString()
        });

        return fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        }).then((res) => res.json());
    }

    /**
     * @param {string} deviceId
     */
    sendHelpRequest(deviceId) {
        const url = `${this.url}:${this.port}/help`;
        console.log("Sending help request");

        const body = new HelpRequest({ roomId: deviceId });

        return fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        }).then((res) => res.json());
    }
}
