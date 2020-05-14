import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { Component, Inject } from "@angular/core";

@Component({
    selector: "confirm-help",
    template: `
          <h1 mat-dialog-title class="text">Confirm</h1>
  
          <div mat-dialog-content class="text">
              <p *ngIf="data">Your help request has been recieved; A member of our support staff is on their way.</p>
              <p *ngIf="!data">Your help request failed to send; Please try again</p>
          </div>
  
          <div mat-dialog-actions class="items secondary-theme">
              <button mat-raised-button
                  color="warn"
                  (click)="cancel();">OK
                  </button>
          </div>
      `,
    styles: [
      `
        .text {
          text-align: center;
          font-family: Roboto, "Helvetica Neue", sans-serif;
        }
  
        .items {
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
        }
      `
    ]
  })
export class ConfirmHelpDialog {
    constructor(
        public dialogRef: MatDialogRef<ConfirmHelpDialog>,
        @Inject(MAT_DIALOG_DATA) public data: boolean
    ) {}
    
    public cancel() {
        this.dialogRef.close();
    }
} 