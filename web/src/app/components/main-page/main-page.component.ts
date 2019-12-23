import { Component, OnInit } from '@angular/core';
import { MatIconRegistry } from '@angular/material';
import { DomSanitizer } from '@angular/platform-browser';
import { DataService, RoomStatus, ScheduledEvent } from 'src/app/services/data/data.service';
import { Router } from '@angular/router'

@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.scss']
})
export class MainPageComponent implements OnInit {
  status: RoomStatus;
  currentEvent: ScheduledEvent;

  constructor(private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
    private dataService: DataService,
    private router: Router) {
    this.matIconRegistry.addSvgIcon(
      "Calendar",
      this.domSanitizer.bypassSecurityTrustResourceUrl("./assets/CALENDAR.svg")
    );
    this.matIconRegistry.addSvgIcon(
      "Plus",
      this.domSanitizer.bypassSecurityTrustResourceUrl("./assets/Plus.svg")
    );
  }

  ngOnInit() {
    this.status = this.dataService.getRoomStatus();
    this.currentEvent = this.dataService.getCurrentEvent();
    this.updateStatus();
  }

  routeToBook(): void {
    this.router.navigate(['/book']);
  }

  routeToSchedule(): void {
    this.router.navigate(['/schedule']);
  }

  updateStatus(): void {
    setInterval(() => {
      this.status = this.dataService.getRoomStatus();
      this.currentEvent = this.dataService.getCurrentEvent();
    }, 15000);
  }
}
