import { Base } from "../queries/base.model";

export class StatisticsContainerModel extends Base {
	constructor() {
		super();
		this.gauges = [];
		this.type = "STATISTICS";
	}

	public name: string;
	public type: "STATISTICS" | "other type";
	public gauges: StatisticsModel[];
	public shared: boolean;
}

export class StatisticsModel {
	// note: we omit the "result" property that was present in the old AngularJS downtimes
	public selection: Selection;
}

// note: we omit some shift-related properties that were present in the old AngularJS downtimes
interface Selection {
	dateFrom: string;
	dateTo: string;
	equipments: string[];
	timeFilterType: "DATE"; // we do not support the shift option from the old AngularJS downtimes
	activity: string;
	dynamicDaily?: boolean;
	dynamicWeekly?: boolean;
}
