import { Injectable } from '@angular/core';
import { ScheduledEvent, DataService } from '../data/data.service';

import * as moment from 'moment/moment';

export interface SelectTime {
  id: number;
  value: string;
  viewValue: string;
  validStart: boolean;
  validEnd: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class BookService {
  currentEvents: ScheduledEvent[];
  timeIncrements: SelectTime[];

  constructor(private dataService: DataService) {
    this.currentEvents = this.dataService.getSchedule();
  }

  calculateTimeIncrements(): void {
    this.timeIncrements = [];
    let currTime = new Date();
    if (currTime.getMinutes() >= 30) {
      currTime.setMinutes(30);
    } else {
      currTime.setMinutes(0);
    }

    let lastTime = new Date();
    lastTime.setHours(23, 30, 0, 0);

    let id = 0;
    while (currTime.getTime() <= lastTime.getTime()) {
      //Add to time increments
      let validStart = true;
      let validEnd = true;
      if (id == 0) validEnd = false;
      if (currTime.getTime() == lastTime.getTime()) validStart = false;
      this.timeIncrements.push({ id: id, value: moment(currTime).format("HH mm"), viewValue: moment(currTime).format('h:mm a'), validStart: validStart, validEnd: validEnd });
      //Increase by 30 min
      if (currTime.getMinutes() >= 30) {
        currTime.setHours(currTime.getHours() + 1, 0, 0, 0);
      } else {
        currTime.setMinutes(30);
      }
      id++;
    }
  }

  disableInvalidTimeIncrements(): void {
    for (let i = 0; i < this.timeIncrements.length; i++) {
      let time = new Date();
      time.setHours(parseInt(this.timeIncrements[i].value.substr(0, 2)), parseInt(this.timeIncrements[i].value.substr(3, 2)), 0, 0);
      for (let j = 0; j < this.currentEvents.length; j++) {
        if ((time.getTime() >= this.currentEvents[j].startTime.getTime()) && (time.getTime() <= this.currentEvents[j].endTime.getTime())) {
          this.timeIncrements[i].validStart = false;
          this.timeIncrements[i].validEnd = false;
          if ((time.getTime() == this.currentEvents[j].startTime.getTime()) && i != 0 && this.timeIncrements[i - 1].validStart) {
            this.timeIncrements[i].validEnd = true;
          } else if (time.getTime() == this.currentEvents[j].endTime.getTime()) {
            this.timeIncrements[i].validStart = true;
          }
        }
      }
    }
    for (let i = 0; i < this.timeIncrements.length; i++) {
      if (i != 0 && !this.timeIncrements[i - 1].validStart) {
        this.timeIncrements[i].validEnd = false;
      }
      if (i != this.timeIncrements.length - 1 && !this.timeIncrements[i + 1].validEnd) {
        this.timeIncrements[i].validStart = false;
      }
    }
  }

  getTimeIncrements(): SelectTime[] {
    console.log("Calculating time increments...");
    this.currentEvents = this.dataService.getSchedule();
    this.calculateTimeIncrements();
    this.disableInvalidTimeIncrements();
    return this.timeIncrements;
  }
}
