import { Component, OnInit, Input } from '@angular/core';
import { ScheduledEvent } from 'src/app/services/data/data.service';

@Component({
  selector: 'app-schedule-list',
  templateUrl: './schedule-list.component.html',
  styleUrls: ['./schedule-list.component.scss']
})
export class ScheduleListComponent implements OnInit {
  @Input()
  event: ScheduledEvent;
  duration: string = "";

  constructor() { }

  ngOnInit() {
    this.calcDuration();
  }

  calcDuration(): void {
    let hours = this.event.endTime.getHours() - this.event.startTime.getHours();
    var minutes = this.event.endTime.getMinutes();
    if (minutes < this.event.startTime.getMinutes()) {
      hours -= 1;
      minutes += 60;
    }
    minutes -= this.event.startTime.getMinutes();
    if (hours > 0) {
      this.duration += hours.toString() + " Hours ";
    }
    if (minutes > 0) {
      this.duration += minutes.toString() + " Minutes";
    }
  }
}
