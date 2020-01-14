import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { ScheduledEvent, DataService } from 'src/app/services/data/data.service';

@Component({
  selector: 'app-book-dialog',
  templateUrl: './book-dialog.component.html',
  styleUrls: ['./book-dialog.component.scss']
})
export class BookDialogComponent implements OnInit {
  message: string;
  response: boolean;

  constructor(private dataService: DataService,
    public dialogRef: MatDialogRef<BookDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ScheduledEvent) { }

  ngOnInit() {
    this.message = 'Submitting event...';
    // if (this.dataService.submitNewEvent(this.data)) {
    //   this.onSuccess();
    // } else {

    // }
  }

  onSuccess() {
    this.message = '';
  }

  onFailure() {
    this.message = '';
  }

}
