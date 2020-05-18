import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";

import * as moment from "moment/moment";
import { Observable } from 'rxjs';

export class RoomStatus {
  roomName: string;
  deviceName: string;
  unoccupied: boolean;
  emptySchedule: boolean;
  displayBookNow: boolean;
  displayTitle: boolean;
  displayHelp: boolean;
}

export class OutputEvent {
  title: string;
  startTime: string;
  endTime: string;
}

export class ScheduledEvent {
  title: string;
  startTime: Date;
  endTime: Date;
}

export class HelpRequest {
  roomId: string;
}

@Injectable({
  providedIn: "root"
})
export class DataService {
  url: string;
  port: string;
  status: RoomStatus;
  config: Object;

  currentSchedule: ScheduledEvent[] = [];

  constructor(private http: HttpClient) {
    const base = location.origin.split(":");
    this.url = base[0] + ":" + base[1];
    console.log(this.url);
    this.port = base[2];
    console.log(this.port);
    if (this.port == undefined) {
      this.port = "80";
    }

    this.status = {
      roomName: "",
      deviceName: "",
      unoccupied: true,
      emptySchedule: false,
      displayBookNow: true,
      displayTitle: true,
      displayHelp: true
    };

    this.getConfig();

    this.getScheduleData();
    setInterval(() => {
      this.getScheduleData();
    }, 30000);
    this.getCurrentEvent();
  }

  getBackground(): string {
    if (
      this.config &&
      this.config.hasOwnProperty("image-url") &&
      this.config["image-url"] != ""
    ) {
      return this.url + ":" + this.port + this.config["image-url"];
    }

    return "assets/YMountain.png";
  }

  getStylesheet(): string {
    if (
      this.config &&
      this.config.hasOwnProperty("style-url") &&
      this.config["style-url"] != ""
    ) {
      return this.url + ":" + this.port + this.config["style-url"];
    }
    return "assets/custom.css";
  }

  getRoomStatus(): RoomStatus {
    return this.status;
  }

  getSchedule(): ScheduledEvent[] {
    return this.currentSchedule;
  }

  getCurrentEvent(): ScheduledEvent {
    const time = new Date();

    if (!this.status.emptySchedule) {
      for (const event of this.currentSchedule) {
        if (
          time.getTime() >= event.startTime.getTime() &&
          time.getTime() < event.endTime.getTime()
        ) {
          this.status.unoccupied = false;
          return event;
        }
      }
    }
    this.status.unoccupied = true;
    return null;
  }

  getConfig = async () => {
    console.log("Getting config...");

    await this.http.get(this.url + ":" + this.port + "/config").subscribe(
      data => {
        this.config = data;
        console.log("config", this.config);
        this.status.roomName = this.config["displayName"];
        this.status.deviceName = this.config["_id"];
        this.status.displayBookNow = this.config["canCreateEvents"];
        this.status.displayTitle = this.config["displayMeetingTitle"];
        this.status.displayHelp = this.config["canRequestHelp"];
      },
      err => {
        setTimeout(() => {
          console.error("failed to get config", err);
          this.getConfig();
        }, 5000);
      }
    );
  };

  getScheduleData = async () => {
    const url =
      this.url + ":" + this.port + "/" + this.status.deviceName + "/events";
    console.log("Getting schedule data from: ", url);

    await this.http.get<ScheduledEvent[]>(url).subscribe(
      data => {
        if (data == null) {
          this.status.emptySchedule = true;
        } else {
          this.status.emptySchedule = false;
          this.currentSchedule = data;
          for (const event of this.currentSchedule) {
            event.startTime = new Date(event.startTime);
            event.endTime = new Date(event.endTime);
          }
        }
        console.log("Schedule updated");
      },
      err => {
        setTimeout(() => {
          console.error("failed to get schedule data", err);
          this.getScheduleData();
        }, 5000);
      }
    );
  };

  submitNewEvent(event: ScheduledEvent): Observable<Object> {
    const url =
      this.url + ":" + this.port + "/" + this.status.deviceName + "/events";
    console.log("Submitting new event to ", url);
    const httpHeaders = {
      headers: new HttpHeaders({
        "Content-Type": "application/json"
      })
    };

    const body = new OutputEvent();
    body.title = event.title;
    body.startTime = moment(event.startTime).format("YYYY-MM-DDTHH:mm:ssZ");
    body.endTime = moment(event.endTime).format("YYYY-MM-DDTHH:mm:ssZ");

    return this.http.post(url, body, httpHeaders);
  }

  sendHelpRequest(deviceId: string): Observable<Object> {
    const url =
      this.url + ":" + this.port + "/help";
    console.log("sending help request");
    const httpHeaders = {
      headers: new HttpHeaders({
        "Content-Type": "application/json"
      })
    };

    const body = new HelpRequest();
    body.roomId = deviceId;

    return this.http.post(url, body, httpHeaders);
  };
}
