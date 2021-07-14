import { BrowserModule } from "@angular/platform-browser";
import { NgModule, ModuleWithProviders } from "@angular/core";

import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { HttpClientModule } from "@angular/common/http";

import { FlexLayoutModule } from "@angular/flex-layout";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { MatNativeDateModule } from "@angular/material";
import { MatTabsModule } from "@angular/material/tabs";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { CdkTableModule } from "@angular/cdk/table";
import { MatTableModule } from "@angular/material/table";
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { MatDialogModule } from "@angular/material/dialog";
import { MatGridListModule } from "@angular/material/grid-list";
import { MatDividerModule } from "@angular/material/divider";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatSelectModule } from "@angular/material/select";
import { MatCardModule } from "@angular/material/card";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatChipsModule } from "@angular/material/chips";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { FullCalendarModule } from "@fullcalendar/angular";
import { FlatpickrModule } from "angularx-flatpickr";
import { MatMenuModule } from "@angular/material/menu";

import { TreeModule } from "angular-tree-component";
import { NgxMatSelectSearchModule } from "ngx-mat-select-search";
import { NgxChartsModule } from "@swimlane/ngx-charts";

import { MovBaseModule } from "@movilitas/mov-base";

import { TeamsComponent } from "./masterdata/teams/teams.component";
import { ActivitiesComponent } from "./masterdata/activities/activities.component";
import { EquipmentsComponent } from "./masterdata/equipments/equipments.component";
import { CausesSolutionsComponent } from "./masterdata/causes-solutions/causes-solutions.component";
import { SettingsComponent } from "./masterdata/settings/settings.component";
import { OverviewComponent } from "./masterdata/overview/overview.component";
import { ActivitiesTreeComponent } from "./shared/activities-tree.component";
import { ReportsComponent } from "./reports/reports.component";
import { ConfirmationModalComponent } from "./shared/modals/confirmation-modal/confirmation-modal.component";
import { DowntimesRegistrationComponent } from "./downtimes-registration/downtimes-registration.component";
import { LocalizationModalComponent } from "./shared/modals/localization-modal/localization-modal.component";
import { ReportsDataComponent } from "./reports/data/data.component";
import { ReportsStatisticsComponent } from "./reports/statistics/statistics.component";
import { ReportsTimelineComponent } from "./reports/timeline/timeline.component";
import { SplitDowntimeModalComponent } from "./downtimes-registration/split-downtime-modal/split-downtime-modal.component";
import { GaugeComponent } from "./reports/statistics/gauge/gauge.component";
import { ViewsModalComponent } from "./reports/statistics/views/views-modal.component";
import { SaveViewModalComponent } from "./reports/statistics/save-view/save-view-modal.component";
import { GaugeDataService } from "./reports/statistics/gauge/gauge-data.service";
import { ListDataDetailsModalComponent } from "./reports/statistics/gauge/list-data-details/list-data-details-modal.component";

import { ActivitiesService } from "./core/services/activities.service";
import { CausesService } from "./core/services/causes.service";
import { SolutionsService } from "./core/services/solutions.service";
import { SettingsService } from "./core/services/settings.service";
import { DowntimesService } from "./core/services/downtimes.service";
import { TreeService } from "./shared/tree.service";
import { TeamsService } from "./core/services/teams.service";
import { DeclareDowntimeModalComponent } from "./downtimes-registration/declare-downtime-modal/declare-downtime-modal.component";
import { BreadcrumbsComponent } from "./shared/modals/breadcrumbs/breadcrumbs.component";
import { ReportsService } from "./core/services/reports.service";

import { DateTimeService } from "./core/services/date-time.service";
import { ColorService } from "./core/services/color.service";
import { ReplaceVariablesPipe } from "./shared/replace-variables.pipe";
import { AddEquipmentClassModalComponent } from "./masterdata/equipments/add-equipment-class-modal/add-equipment-class-modal.component";
import { AddEquipmentModalComponent } from "./masterdata/equipments/add-equipment-modal/add-equipment-modal.component";
import { FilterPipe } from './shared/pipes/filter.pipe';

@NgModule({
	declarations: [
		TeamsComponent,
		ActivitiesComponent,
		EquipmentsComponent,
		CausesSolutionsComponent,
		SettingsComponent,
		OverviewComponent,
		ActivitiesTreeComponent,
		ReportsComponent,
		ConfirmationModalComponent,
		DowntimesRegistrationComponent,
		LocalizationModalComponent,
		ReportsDataComponent,
		ReportsStatisticsComponent,
		ReportsTimelineComponent,
		DeclareDowntimeModalComponent,
		BreadcrumbsComponent,
		SplitDowntimeModalComponent,
		GaugeComponent,
		ViewsModalComponent,
		SaveViewModalComponent,
		ListDataDetailsModalComponent,
		ReplaceVariablesPipe,
		AddEquipmentClassModalComponent,
		AddEquipmentModalComponent,
		FilterPipe,
	],
	entryComponents: [
		LocalizationModalComponent,
		DeclareDowntimeModalComponent,
		SplitDowntimeModalComponent,
		GaugeComponent,
		ViewsModalComponent,
		SaveViewModalComponent,
		ListDataDetailsModalComponent,
		AddEquipmentClassModalComponent,
		AddEquipmentModalComponent,
	],
	imports: [
		MovBaseModule,
		BrowserAnimationsModule,
		FormsModule,
		HttpClientModule,
		FlexLayoutModule,
		BrowserModule,
		ReactiveFormsModule,
		TreeModule.forRoot(),
		NgxMatSelectSearchModule,
		MatTabsModule,
		MatButtonModule,
		MatCheckboxModule,
		CdkTableModule,
		MatTableModule,
		MatPaginatorModule,
		MatSnackBarModule,
		MatDialogModule,
		MatGridListModule,
		MatDividerModule,
		MatFormFieldModule,
		MatInputModule,
		MatIconModule,
		MatButtonToggleModule,
		MatSelectModule,
		MatCardModule,
		MatSlideToggleModule,
		MatProgressSpinnerModule,
		MatDatepickerModule,
		NgxChartsModule,
		MatNativeDateModule,
		MatChipsModule,
		MatAutocompleteModule,
		FullCalendarModule,
		FlatpickrModule.forRoot({
			time24hr: true,
			altFormat: "d/m/Y H:i:S",
			dateFormat: "Z",
			allowInput: false,
		}),
		MatMenuModule,
	],
	providers: [
		ActivitiesService,
		CausesService,
		SolutionsService,
		DowntimesService,
		SettingsService,
		TreeService,
		TeamsService,
		ReportsService,
		GaugeDataService,
		DateTimeService,
		ColorService,
		FilterPipe
	],
})
export class MovDowntimesModule { }
