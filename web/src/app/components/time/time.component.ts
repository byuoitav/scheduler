import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-time',
  templateUrl: './time.component.html',
  styleUrls: ['./time.component.scss']
})
export class TimeComponent implements OnInit {

  time: Date = new Date();


  constructor() { }

  ngOnInit() {
    this.updateTime();
  }

  updateTime(): void {
    setInterval(() => {
      this.time = new Date();
    }, 1000);
  }

}
