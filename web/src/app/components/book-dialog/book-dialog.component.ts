import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatIconRegistry } from '@angular/material';
import { ScheduledEvent, DataService } from 'src/app/services/data/data.service';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-book-dialog',
  templateUrl: './book-dialog.component.html',
  styleUrls: ['./book-dialog.component.scss']
})
export class BookDialogComponent implements OnInit {
  message: string;
  response: boolean;
  status: string = 'submit';

  constructor(private dataService: DataService,
    private iconRegistry: MatIconRegistry,
    private sanitizer: DomSanitizer,
    public dialogRef: MatDialogRef<BookDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ScheduledEvent) {
    this.dialogRef.disableClose = true;
    this.dialogRef.backdropClick().subscribe(result => {
      this.dialogRef.close(this.status);
    });

    this.iconRegistry.addSvgIcon('check-mark', sanitizer.bypassSecurityTrustResourceUrl('assets/check.svg'));
    this.iconRegistry.addSvgIcon('x-mark', this.sanitizer.bypassSecurityTrustResourceUrl('assets/close.svg'));
  }

  ngOnInit() {
    this.message = 'Submitting event...';
    this.dataService.submitNewEvent(this.data).subscribe(
      data => {
        console.log("Event submitted");
        console.log(data);
        this.dataService.getScheduleData();
        this.onSuccess();
      },
      err => {
        console.log("failed to sent event", err);
        this.onFailure();
      }
    );
    setTimeout(() => {
      this.dialogRef.close(this.status);
    }, 2000);
  }

  onSuccess() {
    this.status = 'success';
    this.message = 'Event submitted successfully';
  }

  onFailure() {
    this.status = 'failure';
    this.message = 'Event failed to submit, please try again';
  }

}
