import moment from "moment";
import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit, ElementRef } from "@angular/core";
import { Equipment } from "../../core/models/queries/equipment.model";
import { FormControl } from "@angular/forms";
import { Subscription, Observable } from "rxjs";
import { EquipmentService } from "../../core/services/equipment.service";
import { map, startWith } from "rxjs/operators";
import resourceTimelinePlugin, { ResourceTimelineView } from "@fullcalendar/resource-timeline";
import { FullCalendarComponent } from "@fullcalendar/angular";
import { Calendar } from "@fullcalendar/core";
import { MatAutocompleteSelectedEvent } from "@angular/material";
import { EventApi } from "@fullcalendar/core";
import { ReportsSearchModel } from "../../core/models/reports-search.model";
import { ReportsService } from "../../core/services/reports.service";
import { LanguageCodes } from "../../core/enums/language-codes.enum";
import { SettingsService } from "../../core/services/settings.service";
import { Setting } from "../../core/models/queries/setting.model";

@Component({
	selector: "lib-downtimes-reports-timeline",
	templateUrl: "./timeline.component.html",
	styleUrls: ["./timeline.component.css"]
})
export class ReportsTimelineComponent implements OnInit, OnDestroy, AfterViewInit {
	@ViewChild("fullCalendar", { static: false })
	calendarComponent: FullCalendarComponent;

	private fullCalendar!: Calendar;
	private zoomLevel = 4;
	private slotDurations = [5, 10, 15, 30, 60, 120, 240, 480];
	private slotLabelIntervals = [10, 10, 30, 60, 120, 120, 240, 480];

	public showCalendar = false;
	public canSearch = false;

	calendarPlugins = [resourceTimelinePlugin];
	public equipmentResources: EquipmentResource[] = [];
	public equipmentsEvent: EquipmentEvent[] = [];

	public equipmentsSelected: Equipment[] = [];
	public filteredEquipments$: Observable<Equipment[]>;
	public equipmentsFilterControl = new FormControl();
	public date = new Date();
	public isLive = false;
	private isLiveInterval?: number; // holds reference returned from setInterval
	public showShortStop = true;

	public endOfToday = moment()
		.endOf("date")
		.toISOString();

	@ViewChild("equipmentInput", { static: false }) equipmentInput: ElementRef<HTMLInputElement>;

	public showDowntimeInfo = false;
	public downtimeInfo?: {
		resourceId: string;
		title: string;
		start: Date;
		extendedProps: ExtendedPropsEvent;
		end?: Date;
	};

	public allEquipments: Equipment[];
	public filteredEquipments: Equipment[] = [];
	private equipmentsSubscription: Subscription;
	private eventSubscription: Subscription;
	private useVeri95Equipments: boolean;
	private masterSettingsServiceSubscription: Subscription;

	constructor(
		private equipmentService: EquipmentService,
		private reportsService: ReportsService,
		private masterSettingsService: SettingsService
	) {}

	public ngOnInit() {
		this.masterSettingsServiceSubscription = this.masterSettingsService.masterdataSettings$.subscribe(
			(currentSettings: Setting) => {
				this.useVeri95Equipments = currentSettings.useveri95Equipments;
			}
		);

		this.equipmentService.sync();

		this.equipmentsSubscription = this.equipmentService.equipments$.subscribe(equipments => {
			if (equipments.length > 0) {
				if (this.useVeri95Equipments) {
					// This is needed if we get the last element as total count otherwise we should get all equipments.
					this.allEquipments = equipments.slice(0, equipments.length);
				} else {
					this.allEquipments = equipments.slice(0, equipments.length - 1);
				}
				this.filteredEquipments = this.allEquipments.slice();

				this.equipmentsFilterControl.setValue(null);

				this.filteredEquipmentsInitControl();
			}
		});
	}

	private filteredEquipmentsInitControl() {
		if (!this.filteredEquipments$) {
			this.filteredEquipments$ = this.equipmentsFilterControl.valueChanges.pipe(
				// tslint:disable-next-line: deprecation
				startWith(null),
				map((word: string | null) =>
					word ? this._filterEquipments(word) : this.allEquipments.slice()
				)
			);
		}
	}

	private _filterEquipments(value: any) {
		if (!(value instanceof Object)) {
			const filterValue = value.toLowerCase();
			return this.filteredEquipments.filter(eq => {
				if (eq.id && eq.id.toLowerCase().indexOf(filterValue) === 0) {
					return eq;
				}
			});
		}
	}

	public ngAfterViewInit() {
		this.fullCalendar = this.calendarComponent.getApi();

		this.fullCalendar.setOption("customButtons", {
			zoomOut: {
				text: "-",
				click: () => this.zoomOut()
			},
			zoomIn: {
				text: "+",
				click: () => this.zoomIn()
			}
		});

		this.fullCalendar.setOption("eventMouseEnter", (mouseEvent: MouseEventInterface) => {
			this.mouseEnter(mouseEvent);
		});

		this.fullCalendar.setOption("eventMouseLeave", (mouseEvent: MouseEventInterface) => {
			this.mouseOut(mouseEvent);
		});
	}

	public dayRender() {
		if (!this.fullCalendar || !this.fullCalendar.getDate()) {
			return;
		}

		const fCToDateString = this.fullCalendar.getDate().toDateString();
		const btnPrev: HTMLButtonElement = document.querySelector(".fc-prev-button");
		const btnNext: HTMLButtonElement = document.querySelector(".fc-next-button");
		const isMaxDate = fCToDateString === this.fullCalendar.getNow().toDateString();

		if (fCToDateString !== this.date.toDateString()) {
			this.refreshEquipmentEvents();
		}

		this.date = this.fullCalendar.getDate();

		if (this.isLive && btnPrev) {
			btnPrev.disabled = true;
		} else if (btnPrev) {
			btnPrev.disabled = false;
		}

		if (btnNext && (this.isLive || isMaxDate)) {
			btnNext.disabled = true;
		} else if (btnNext) {
			btnNext.disabled = false;
		}
	}

	private refreshCanSearch() {
		this.canSearch = this.date && this.equipmentsSelected.length > 0;
	}

	public isLiveChanged() {
		this.date = new Date();
		this.refreshEquipmentEvents();

		if (this.isLiveInterval) {
			clearInterval(this.isLiveInterval);
		}

		if (this.isLive) {
			this.modelDateChanged();

			const handler: TimerHandler = () => {
				this.refreshEquipmentEvents();
			};

			this.isLiveInterval = setInterval(handler, 60000);
		}
	}

	public modelDateChanged() {
		this.fullCalendar.gotoDate(this.date.toISOString());
		this.showCalendar = false;
		this.refreshCanSearch();
	}

	private zoomIn() {
		if (this.zoomLevel - 1 < 0) {
			return;
		}

		this.zoomLevel--;

		this.fullCalendar.setOption("slotDuration", {
			minutes: this.slotDurations[this.zoomLevel]
		});

		this.fullCalendar.setOption("slotLabelInterval", {
			minutes: this.slotLabelIntervals[this.zoomLevel]
		});
	}

	private zoomOut() {
		if (this.zoomLevel + 1 > this.slotDurations.length - 1) {
			return;
		}

		this.zoomLevel++;

		this.fullCalendar.setOption("slotDuration", {
			minutes: this.slotDurations[this.zoomLevel]
		});

		this.fullCalendar.setOption("slotLabelInterval", {
			minutes: this.slotLabelIntervals[this.zoomLevel]
		});
	}

	public remove(equipment: Equipment) {
		const index = this.equipmentsSelected.findIndex(eq => eq.id === equipment.id);

		if (index > -1) {
			this.equipmentsSelected.splice(index, 1);
			const eq = this.allEquipments.find(e => e.id === equipment.id);

			if (!eq) {
				this.allEquipments.push(equipment);
			}

			this.equipmentsFilterControl.setValue(null);
		}

		this.showCalendar = false;
		this.refreshCanSearch();
	}

	public selected(event: MatAutocompleteSelectedEvent) {
		const eqIdx = this.allEquipments.findIndex(e => e.id === event.option.value.id);

		if (eqIdx > -1) {
			this.equipmentsSelected.push(this.allEquipments[eqIdx]);
			this.allEquipments.splice(eqIdx, 1);
			this.equipmentsFilterControl.setValue("");
			this.equipmentInput.nativeElement.value = "";
			this.equipmentsFilterControl.setValue(null);
		}

		this.showCalendar = false;
		this.refreshCanSearch();

		this.equipmentsFilterControl.disable();
		this.equipmentsFilterControl.enable();
	}

	public search(_date: string) {
		this.refreshEquipmentEvents();
	}

	private refreshEquipmentEvents() {
		if (this.eventSubscription) {
			this.eventSubscription.unsubscribe();
		}

		const equipmentsSelectedIds = this.equipmentsSelected.map(e => e.id);

		if (equipmentsSelectedIds.length < 1) {
			return;
		}

		this.date = this.fullCalendar.getDate();

		this.eventSubscription = this.reportsService
			.getAll(LanguageCodes.English, this.getSearchModel(), 0, 0)
			.subscribe(di => {
				this.equipmentsEvent = di.map(d => {
					return {
						resourceId: d.WorkCenter,
						start: d.Start,
						end: d.Stop,
						title: d.WorkCenter,
						showShortStop: d.isShortStop ? JSON.parse(d.isShortStop) : false,
						duration: d.Duration,
						teamName: d.Team,
						solutionName: d.solutionName,
						causeName: d.causeName
					} as EquipmentEvent;
				});

				this.equipmentsEvent = this.equipmentsEvent.filter(ee => {
					if (this.showShortStop) {
						return ee;
					} else {
						return !ee.showShortStop;
					}
				});

				this.showCalendar = true;

				this.equipmentResources = [];

				this.equipmentsSelected.map(es => {
					this.equipmentResources.push({
						id: es.id,
						title: es.id
					});
				});

				this.fullCalendar.setOption("slotDuration", {
					minutes: 60
				});

				this.fullCalendar.setOption("slotLabelInterval", {
					minutes: 120
				});
			});
	}

	private mouseEnter(mouseEvent: MouseEventInterface) {
		const event = mouseEvent.event;

		this.downtimeInfo = {
			title: event.title,
			resourceId: event.title,
			start: event.start,
			end: event.end,
			extendedProps: {
				showShortStop: event.extendedProps.showShortStop,
				duration: event.extendedProps.duration,
				causeName: event.extendedProps.causeName,
				solutionName: event.extendedProps.solutionName,
				teamName: event.extendedProps.teamName
			}
		};

		this.showDowntimeInfo = true;
	}

	private mouseOut(_mouseEvent: MouseEventInterface) {
		this.showDowntimeInfo = false;
	}

	private getSearchModel() {
		const start = moment(this.date)
			.startOf("date")
			.toISOString();

		const end = moment(this.date)
			.endOf("date")
			.toISOString();

		const searchModel = new ReportsSearchModel();
		searchModel.from = new Date(start);
		searchModel.to = new Date(end);
		searchModel.equipmentsSelected = this.equipmentsSelected;
		return searchModel;
	}

	public ngOnDestroy() {
		if (this.eventSubscription) {
			this.eventSubscription.unsubscribe();
		}

		this.equipmentsSubscription.unsubscribe();
		this.masterSettingsServiceSubscription.unsubscribe();
	}
}

interface EquipmentResource {
	id: string;
	title: string;
	eventColor?: string; // Color of event like "green", "orange"
}

interface ExtendedPropsEvent {
	showShortStop: boolean;
	duration?: string;
	teamName?: string;
	solutionName?: string;
	causeName?: string;
}

interface EquipmentEvent extends ExtendedPropsEvent {
	resourceId: string;
	title: string;
	start: string;
	end?: string;
}

interface EventWithPropsApi extends EventApi {
	extendedProps: ExtendedPropsEvent;
}

interface MouseEventInterface {
	el: HTMLElement;
	event: EventWithPropsApi; // what we put extra to equipment event it gets into extendedProps property
	jsEvent: MouseEvent;
	view: ResourceTimelineView;
}
