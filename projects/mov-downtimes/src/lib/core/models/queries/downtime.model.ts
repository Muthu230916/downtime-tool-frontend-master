import { Base } from "./base.model";

import moment from "moment";
import { DateTimeService } from "../../services/date-time.service";

export class Downtime {
	itemsToShow: ShowDowntimeItem[];
	totalCount: number;
	Items: DowntimeItem[];

	constructor(dateTimeService: DateTimeService, items: DowntimeItem[], totalCount?: number) {
		if (totalCount > 0) {
			this.itemsToShow = items.map((i) => {
				let Duration = "";

				if (i.endTime !== "") {
					const momentDuration = moment.duration(+i.duration, "seconds");

					Duration = dateTimeService.toDurationString(momentDuration);
				}

				return {
					ID: i.uiid,
					Activity: +i.activityId > 0 ? i.activityName : "undeclared",
					activityId: +i.activityId > 0 ? i.activityId : undefined,
					durationSeconds: i.endTime !== "" ? i.duration : "",
					Duration,
					Start: i.startTime,
					Stop: i.endTime,
					teamId: +i.teamId > 0 ? i.teamId : undefined,
					Team: +i.teamId > 0 ? i.teamName : "",
					isDeclared: +i.activityId > 0 ? true : false,
					batch: i.batch,
					order: i.order,
					WorkCenter: i.equipmentId,
					causeId: +i.causeId > 0 ? i.causeId : undefined,
					causeName: i.causeName,
					solutionName: i.solutionName,
					solutionId: +i.solutionId > 0 ? i.solutionId : undefined,
					// comment: i.comment,
					isShortStop: i.isShortStop,
				} as ShowDowntimeItem;
			});
			if (totalCount) {
				this.totalCount = totalCount;
			}
			this.Items = items;
		}
	}
}

export interface DowntimeItem extends Base {
	startTime: string;
	endTime: string;
	duration: string;
	type: string;
	shortStop: string;
	activityName: string;
	teamName?: string;
	batch?: string;
	order?: string;
	teamId?: string;
	causeId?: string;
	isSplit?: string;
	location?: string;
	causeName?: string;
	solutionId?: string;
	activityId?: string;
	equipmentId?: string;
	isShortStop?: string;
	solutionName?: string;
	// comment?: string;
}

export interface ShowDowntimeItem {
	ID: string;
	WorkCenter: string;
	Activity: string;
	Duration: string;
	Start: string;
	Stop: string;
	Team: string;
	isDeclared: boolean;
	causeName?: string;
	solutionName?: string;
	User?: string;
	// comment?: string;
	durationSeconds?: string;
	activityId?: string;
	causeId?: string;
	solutionId?: string;
	teamId?: string;
	isShortStop?: string;
	batch?: string;
	order?: string;
}
