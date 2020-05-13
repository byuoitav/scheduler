import { Component } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { DataService } from "./services/data/data.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})
export class AppComponent {
  public customStyle: any;
  public background: any;
  private styleTimer: any;
  constructor(private data: DataService, private sanitizer: DomSanitizer) {
    this.styleTimer = setInterval(() => {
      this.getStyles();
      this.getBackground();
      if (this.data.config != null) {
        this.stopStyleTimer();
      }
    }, 1000);
  }

  getBackground() {
    const url = this.data.getBackground();
    const background = "url(" + url + ")";
    this.background = this.sanitizer.bypassSecurityTrustStyle(background);
  }

  getStyles() {
    let url = this.data.getStylesheet();
    this.customStyle = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  stopStyleTimer() {
    clearInterval(this.styleTimer);
  }
}
