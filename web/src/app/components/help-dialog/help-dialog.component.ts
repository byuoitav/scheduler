import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MatDialog, MAT_DIALOG_DATA } from '@angular/material';
import { DataService, HelpRequest } from 'src/app/services/data/data.service';
import { ConfirmHelpDialog } from './confirm-help';

@Component({
  selector: 'app-help-dialog',
  templateUrl: './help-dialog.component.html',
  styleUrls: ['./help-dialog.component.scss']
})
export class HelpDialogComponent implements OnInit {

  constructor(public mainRef: MatDialogRef<HelpDialogComponent>,
    private dataService: DataService,
    public confirmRef: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: string){}

  ngOnInit() {

  }

  public cancel() {
    this.mainRef.close();
  }

  public requestHelp() {
    console.log("help requested");

    //actually send the request
    let requestStatus = true;
    this.dataService.sendHelpRequest(this.data).subscribe(
      data => {
        requestStatus = true;
      },
      err => {
        requestStatus = false;
      }
    );
    const dialogRef = this.confirmRef.open(ConfirmHelpDialog, {
      width: "70vw",
      disableClose: true,
      data: requestStatus
    });
    this.cancel();
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
