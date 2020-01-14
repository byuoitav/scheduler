import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material';

@Component({
  selector: 'app-book-dialog',
  templateUrl: './book-dialog.component.html',
  styleUrls: ['./book-dialog.component.scss']
})
export class BookDialogComponent implements OnInit {
  message: string;

  constructor(public dialogRef: MatDialogRef<BookDialogComponent>) { }

  ngOnInit() {
    this.message = 'Submitting event...';
  }



}
