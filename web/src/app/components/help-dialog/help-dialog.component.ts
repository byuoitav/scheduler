import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { DataService } from 'src/app/services/data/data.service';

@Component({
  selector: 'app-help-dialog',
  templateUrl: './help-dialog.component.html',
  styleUrls: ['./help-dialog.component.scss']
})
export class HelpDialogComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<HelpDialogComponent>, public data: DataService) { }

  ngOnInit() {

  }

  public cancel() {
    this.dialogRef.close();
  }

  public requestHelp() {
    console.log("help requested");
  }

  public isAfterHours(): boolean {
    let date = new Date();
    let DayOfTheWeek = date.getDay();
    let CurrentHour = date.getHours();

    switch(DayOfTheWeek) {
      // Sunday
      case 0: { return true; }
      // Monday
      case 1: {
        if(CurrentHour < 7 || CurrentHour >= 19) { return true; }
        else { return false; }
      }
      // Tuesday
      case 2: {
        if(CurrentHour < 7 || CurrentHour >= 21) { return true; }
        else { return false; }
      }
      // Wednesday
      case 3: {
        if(CurrentHour < 7 || CurrentHour >= 21) { return true; }
        else { return false; }
      }
      // Thursday
      case 4: {
        if(CurrentHour < 7 || CurrentHour >= 21) { return true; }
        else { return false; }
      }
      // Friday
      case 5: {
        if(CurrentHour < 7 || CurrentHour >= 20) { return true; }
        else { return false; }
      }
      // Saturday
      case 6: {
        if(CurrentHour < 8 || CurrentHour >= 12) { return true; }
        else { return false; }
      }
      default: { return false; }
    }
  }

}
