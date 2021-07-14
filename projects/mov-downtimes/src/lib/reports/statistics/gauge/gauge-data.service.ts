import { Injectable } from "@angular/core";
import { ShowDowntimeItem } from "../../../core/models/queries/downtime.model";
import { StatisticsModel } from "../../../core/models/queries/statistics-container.model";
import moment, { Moment } from "moment";
import { Activity } from "../../../core/models/queries/activity.model";
import { DateTimeService } from "../../../core/services/date-time.service";
import { TranslateService } from "@movilitas/mov-base";

export interface GaugeData {
	entries: GaugeDataEntry[];
	totalValue: number; // total duration in seconds
}

export interface GaugeDataEntry {
	name: string;
	value: number; // duration in seconds
	extra?: {
		// only set is this entry represents a specific activity
		activity?: {
			id: string;
			color: string;
		};
		// true if this entry represents the total downtime
		isTotalDowntime?: boolean;
	};
}

@Injectable({
	providedIn: "root",
})
export class GaugeDataService {
	constructor(
		private dateTimeService: DateTimeService,
		private translateService: TranslateService
	) {}

	public getGaugeData(
		model: StatisticsModel,
		downtimes: ShowDowntimeItem[],
		activities: Activity[]
	): GaugeData {
		if (
			downtimes.some((downtime) => !model.selection.equipments.includes(downtime.WorkCenter))
		) {
			throw new Error("Provided downtimes don't match equipment selection");
		}

		if (!model.selection.activity) {
			return this.getGaugeDataFromEntries(this.getUptimeDowntimeEntries(model, downtimes));
		} else if (model.selection.activity === "ROOT") {
			return this.getGaugeDataFromEntries(
				this.getTopLevelDowntimesEntries(model, downtimes, activities).filter(
					(entry) => entry.value > 0
				)
			);
		} else {
			return this.getGaugeDataFromEntries(
				this.getEntriesForParentActivity(
					model,
					downtimes,
					activities,
					model.selection.activity
				).filter((entry) => entry.value > 0)
			);
		}
	}

	private getGaugeDataFromEntries(entries: GaugeDataEntry[]): GaugeData {
		let totalValue = 0;

		for (const entry of entries) {
			totalValue = totalValue + entry.value;
		}

		for (const entry of entries) {
			const percentage = this.percentageCalculator(entry.value, totalValue).toFixed(2);
			const durationAsMoment = moment.duration(entry.value, "seconds");
			const durationFormated = this.dateTimeService.toDurationString(durationAsMoment);

			entry.name += `: ${durationFormated} (${percentage}%)`;
		}

		return {
			entries,
			totalValue,
		};
	}

	private getUptimeDowntimeEntries(
		model: StatisticsModel,
		downtimes: ShowDowntimeItem[]
	): GaugeDataEntry[] {
		const periodDuration = this.getPeriodDuration(model);
		const numberEquipments = model.selection.equipments.length;
		const totalPeriodDuration = periodDuration * numberEquipments;

		const totalDowntimesDuration = this.getTotalDowntimesDuration(model, downtimes);
		const totalUptimeDuration = totalPeriodDuration - totalDowntimesDuration;

		return [
			{
				name: this.translateService.get("UPTIME"),
				value: totalUptimeDuration,
				extra: {},
			},
			{
				name: this.translateService.get("DOWNTIME"),
				value: totalDowntimesDuration,
				extra: { isTotalDowntime: true },
			},
		];
	}

	private percentageCalculator(partialValue: number, totalValue: number) {
		return (100 * partialValue) / totalValue;
	}

	private getPeriodDuration(model: StatisticsModel): number {
		const periodStart = moment(model.selection.dateFrom);
		const periodEnd = moment(model.selection.dateTo);
		return periodEnd.diff(periodStart, "seconds");
	}

	private getTotalDowntimesDuration(model: StatisticsModel, downtimes: ShowDowntimeItem[]) {
		let duration = 0;

		for (const downtime of downtimes) {
			duration = duration + this.getDowntimeDurationWithinPeriod(model, downtime);
		}

		return duration;
	}

	private getDowntimeDurationWithinPeriod(model: StatisticsModel, downtime: ShowDowntimeItem) {
		const periodStart = moment(model.selection.dateFrom);
		const downtimeStart = moment(downtime.Start);
		const downtimeStartWithinPeriod = moment.max(periodStart, downtimeStart);

		const periodEnd = moment(model.selection.dateTo);
		let downtimeEnd: Moment;

		if (downtime.Stop) {
			downtimeEnd = moment(downtime.Stop);
		} else {
			// if the downtime hasn't stopped yet, we count its duration up until now
			downtimeEnd = moment();
		}

		const downtimeEndWithinPeriod = moment.min(periodEnd, downtimeEnd);

		return downtimeEndWithinPeriod.diff(downtimeStartWithinPeriod, "seconds");
	}

	private getTopLevelDowntimesEntries(
		model: StatisticsModel,
		downtimes: ShowDowntimeItem[],
		activities: Activity[]
	): GaugeDataEntry[] {
		let undeclaredDowntimesDuration = 0;
		let shortStopDowntimesDuration = 0;
		const normalDowntimes: ShowDowntimeItem[] = [];

		for (const downtime of downtimes) {
			if (downtime.isShortStop) {
				shortStopDowntimesDuration += this.getDowntimeDurationWithinPeriod(model, downtime);
			} else if (!downtime.activityId || downtime.activityId === "") {
				undeclaredDowntimesDuration += this.getDowntimeDurationWithinPeriod(
					model,
					downtime
				);
			} else {
				normalDowntimes.push(downtime);
			}
		}

		return [
			{
				name: this.translateService.get("UNDECLARED"),
				value: undeclaredDowntimesDuration,
				extra: {},
			},
			{
				name: this.translateService.get("SHORT_STOP"),
				value: shortStopDowntimesDuration,
				extra: {},
			},
			...this.getEntriesForParentActivity(model, normalDowntimes, activities, ""),
		];
	}

	private getEntriesForParentActivity(
		model: StatisticsModel,
		downtimes: ShowDowntimeItem[],
		activities: Activity[],
		parentActivity: string
	): GaugeDataEntry[] {
		const groupingActivities = activities.filter(
			(activity) => activity.parentActivity === parentActivity
		);

		if (groupingActivities.length === 0) {
			throw new Error("No child activities found");
		}

		const groupingActivityDurations = this.getDurationsForGroupingActivities(
			groupingActivities,
			downtimes,
			activities,
			model
		);

		return groupingActivities.map((activity) => {
			return {
				name: activity.name,
				value: groupingActivityDurations.get(activity.uiid),
				extra: {
					activity: {
						id: activity.uiid,
						color: activity.color,
					},
				},
			};
		});
	}

	private getDurationsForGroupingActivities(
		groupingActivities: Activity[],
		downtimes: ShowDowntimeItem[],
		activities: Activity[],
		model: StatisticsModel
	) {
		const groupingActivityIds = new Set(groupingActivities.map((act) => act.uiid));

		const groupingActivityIdsAndDurations = new Map<string, number>();

		for (const activityId of groupingActivityIds) {
			groupingActivityIdsAndDurations.set(activityId, 0);
		}

		for (const downtime of downtimes) {
			const matchingActivity = this.getGroupingActivityIdForDowntime(
				downtime,
				groupingActivityIds,
				activities
			);

			if (matchingActivity) {
				const currentDuration = groupingActivityIdsAndDurations.get(matchingActivity);

				const newDuration =
					currentDuration + this.getDowntimeDurationWithinPeriod(model, downtime);

				groupingActivityIdsAndDurations.set(matchingActivity, newDuration);
			}
		}

		return groupingActivityIdsAndDurations;
	}

	private getGroupingActivityIdForDowntime(
		downtime: ShowDowntimeItem,
		groupingActivityIds: Set<string>,
		activities: Activity[]
	) {
		if (!downtime.activityId) {
			return undefined;
		}

		let activityOrAncestorId = downtime.activityId;

		while (activityOrAncestorId !== "") {
			if (groupingActivityIds.has(activityOrAncestorId)) {
				return activityOrAncestorId;
			} else {
				const activity = activities.find((act) => act.uiid === activityOrAncestorId);

				activityOrAncestorId = activity.parentActivity;
			}
		}

		return undefined;
	}
}
