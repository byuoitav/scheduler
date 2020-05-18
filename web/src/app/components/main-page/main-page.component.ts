import { Component, OnInit } from '@angular/core';
import { MatIconRegistry, MatDialog } from '@angular/material';
import { DomSanitizer } from '@angular/platform-browser';
import { DataService, RoomStatus, ScheduledEvent } from 'src/app/services/data/data.service';
import { Router } from '@angular/router'
import { HelpDialogComponent } from '../help-dialog/help-dialog.component';

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
    private router: Router,
    public dialogRef: MatDialog) {
    this.matIconRegistry.addSvgIcon(
      "Calendar",
      this.domSanitizer.bypassSecurityTrustResourceUrl("./assets/CALENDAR.svg")
    );
    this.matIconRegistry.addSvgIcon(
      "Plus",
      this.domSanitizer.bypassSecurityTrustResourceUrl("./assets/Plus.svg")
    );
    this.matIconRegistry.addSvgIcon(
      "Help",
      this.domSanitizer.bypassSecurityTrustResourceUrl("./assets/helpOutline.svg")
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

  requestHelp(): void {
    const dialogRef = this.dialogRef.open(HelpDialogComponent, {
      data: this.dataService.status.deviceName
    });
  }

  updateStatus(): void {
    setInterval(() => {
      this.status = this.dataService.getRoomStatus();
      this.currentEvent = this.dataService.getCurrentEvent();
    }, 15000);
  }
}
