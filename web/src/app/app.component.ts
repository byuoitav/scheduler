import { Component } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { DataService } from "./services/data/data.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})
export class AppComponent {
  constructor(private data: DataService, private sanitizer: DomSanitizer) { }

  get background() {
    const url = this.data.getBackground();
    const background = "url(" + url + ")";

    return this.sanitizer.bypassSecurityTrustStyle(background);
  }
}
