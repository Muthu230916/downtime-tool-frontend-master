import { BrowserModule } from "@angular/platform-browser";
import { NgModule, APP_INITIALIZER } from "@angular/core";

import { MovDowntimesModule } from "mov-downtimes";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { TranslateService, MovBaseModule } from "@movilitas/mov-base";

import { MatDividerModule } from "@angular/material/divider";
import { MatListModule } from "@angular/material/list";
import { MatIconModule } from "@angular/material/icon";

export function loadTranslationsFactory(translateService: TranslateService): Function {
	const f = async () => translateService.use("en");
	return f;
}

@NgModule({
	declarations: [AppComponent],
	imports: [
		BrowserModule,
		MovBaseModule,
		MovDowntimesModule,
		AppRoutingModule,
		MatDividerModule,
		MatListModule,
		MatIconModule
	],
	providers: [
		{
			provide: APP_INITIALIZER,
			useFactory: loadTranslationsFactory,
			deps: [TranslateService],
			multi: true
		}
	],
	bootstrap: [AppComponent]
})
export class AppModule {}
