import { Component, OnInit, ViewEncapsulation, ViewChild, ElementRef } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material';
import Keyboard from 'simple-keyboard';

@Component({
  selector: 'app-keyboard-sheet',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './keyboard-sheet.component.html',
  styleUrls: [
    './keyboard-sheet.component.scss',
    '../../../../node_modules/simple-keyboard/build/css/index.css'
  ]
})
export class KeyboardSheetComponent implements OnInit {
  @ViewChild("eventInput", { static: false }) eventTitle: ElementRef;

  private keyboard: Keyboard;
  eventTitleValue: string = "";
  isShift: boolean = false;

  constructor(private bottomSheetRef: MatBottomSheetRef<KeyboardSheetComponent>) { }

  ngOnInit() { }

  ngAfterViewInit() {
    this.keyboard = new Keyboard({
      onChange: input => this.onChange(input),
      onKeyPress: button => this.onKeyPress(button),
      layout: {
        'default': [
          '` 1 2 3 4 5 6 7 8 9 0 - = {bksp}',
          '{tab} q w e r t y u i o p [ ] \\',
          '{lock} a s d f g h j k l ; \'',
          '{shift} z x c v b n m , . / {enter}',
          '.com @ {space}'
        ],
        'shift': [
          '~ ! @ # $ % ^ & * ( ) _ + {bksp}',
          '{tab} Q W E R T Y U I O P { } |',
          '{lock} A S D F G H J K L : "',
          '{shift} Z X C V B N M < > ? {enter}',
          '.com @ {space}'
        ]
      },
      display: {
        "{enter}": "Confirm",
        "{space}": " ",
        "{bksp}": "Backspace",
        "{tab}": "Tab",
        "{lock}": "Caps",
        "{shift}": "Shift"
      }
    });
  }

  onChange = (input: string) => {
    this.eventTitleValue = input;
  };

  onKeyPress = (button: string) => {
    this.eventTitle.nativeElement.focus();
    if (button === "{enter}") {
      this.bottomSheetRef.dismiss(this.eventTitleValue);
    }
    if (this.isShift) {
      this.handleShift();
      this.isShift = false;
    }
    if (button === "{shift}" || button === "{lock}") this.handleShift();
    if (button === "{shift}") this.isShift = true;
  };

  handleShift = () => {
    let currentLayout = this.keyboard.options.layoutName;
    let shiftToggle = currentLayout === "default" ? "shift" : "default";

    this.keyboard.setOptions({
      layoutName: shiftToggle
    });
  };

}

