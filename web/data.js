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

class RoomStatus {
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

class OutPutEvent {
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

class ScheduledEvent {
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

class HelpRequest {
    /**
     * @param {HelpRequestParams} params
     */
    constructor(params) {
        this.roomId = params?.roomId ?? "";
    }

    setRoomId(roomId) { this.roomId = roomId; }
    getRoomId() { return this.roomId; }
}

class DataService {
    constructor() {
        const base = location.origin.split(":");
        this.url = base[0] + ":" + base[1];
        this.port = base[2] ?? "80";

        this.status = new RoomStatus({
            roomName: "",
            deviceName: "",
            unoccupied: false,
            emptySchedule: false,
            displayBookNow: false,
            displayTitle: false,
            displayHelp: false
        });

        this.currentSchedule = [];
        this.config = {};
    }

    async init() {
        await this.getConfig();
        await this.getScheduleData();
        this.getCurrentEvent();

        setInterval(() => this.getScheduleData(), 1000);
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

    async safeFetch(url, options, actionDescription) {
        try {
            const res = await fetch(url, options);
            if (!res.ok) {
                let serverMessage = "";
                try {
                    serverMessage = await res.text();
                } catch (_) {
                    serverMessage = "<no response body>";
                }
                // @ts-ignore
                window.schedulerError = new schedulerError(
                    `Error while ${actionDescription}. Status: ${res.status} ${res.statusText}. Server message: ${serverMessage}`,
                    true
                );
                return null;
            }
            return res;
        } catch (err) {
            // @ts-ignore
            window.schedulerError = new schedulerError(
                `Network error while ${actionDescription}: ${err.message}`,
                true
            );
            return null;
        }
    }

    async getConfig() {
        console.log("Getting config...");
        const res = await this.safeFetch(this.url + ":" + this.port + "/config", {}, "getting config from couchdb");
        if (!res) return;
        const data = await res.json();
        this.config = data;
        console.log("config", this.config);
        this.status.setRoomName(this.config["displayName"] ?? "");
        this.status.setDeviceName(this.config["_id"] ?? "");
        this.status.setDisplayBookNow(this.config["canCreateEvents"] ?? true);
        this.status.setDisplayTitle(this.config["displayMeetingTitle"] ?? true);
        this.status.setDisplayHelp(this.config["canRequestHelp"] ?? true);
    }

    async getBgImage() {
        return fetch(this.url + ":" + this.port + "/background")
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`Server responded with status ${res.status}`);
                }
                return res.blob();
            })
            .catch((err) => {
                console.error("failed to get background image", err);
            });
    }


    async getScheduleData() {
        const url = this.url + ":" + this.port + "/" + this.status.deviceName + "/events";
        const res = await this.safeFetch(url, {}, "getting schedule data");
        if (!res) return;
        const data = await res.json();

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
    }

    /**
     * @param {ScheduledEvent} event
     */
    async submitNewEvent(event) {
        const url = this.url + ":" + this.port + "/" + this.status.deviceName + "/events";
        console.log("Submitting new event to", url);

        const body = new OutPutEvent({
            title: event.title,
            startTime: event.startTime,
            endTime: event.endTime
        });

        const res = await this.safeFetch(
            url,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            },
            "submitting a new event"
        );
        if (!res) return null;
        return await res.json();
    }

    /**
     * @param {string} deviceId
     */
    async sendHelpRequest(deviceId) {
        const url = this.url + ":" + this.port + "/help";
        console.log("Sending help request");

        const body = new HelpRequest({ roomId: deviceId });

        const res = await this.safeFetch(
            url,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            },
            "sending help request"
        );
        if (!res) return null;
        return await res.json();
    }
}
