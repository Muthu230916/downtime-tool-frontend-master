import { Component } from "@angular/core";
import { ApplicationService } from "@movilitas/mov-base";

@Component({
	selector: "app-root",
	templateUrl: "./app.component.html",
	styleUrls: ["./app.component.css"]
})
export class AppComponent {
	constructor(private application: ApplicationService) {
		this.application.title = "Downtimes";
		this.application.pathToLogo = "favicon.ico";
		this.application.menuMode = "over";
	}
}
