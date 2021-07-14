import { Equipment } from "./queries/equipment.model";

import moment, { Moment } from "moment";

export class ReportsSearchModel {
	public equipmentsSelected: Equipment[] = [];
	public from: Date;
	public to: Date;
	public showAll = true;
	public showDeclared = false;
	public showUndeclared = false;
	public showOngoing = false;
	public showShortStop = false;

	constructor() {
		this.to = new Date();
	}

	public getEquipmentsSubQuery() {
		let equipmentsAsString = "( ";
		// tslint:disable-next-line: forin
		for (const key in this.equipmentsSelected) {
			if (+key < this.equipmentsSelected.length - 1) {
				equipmentsAsString +=
					"e.equipmentId.id = '" + this.equipmentsSelected[key].id + "' OR ";
			}
			if (+key === this.equipmentsSelected.length - 1) {
				equipmentsAsString +=
					"e.equipmentId.id = '" + this.equipmentsSelected[key].id + "' )";
			}
		}

		if (this.equipmentsSelected.length === 0) {
			return "";
		}

		return equipmentsAsString;
	}

	public getDateTimePeriodSubQuery() {
		if (this.from instanceof Date && this.to instanceof Date) {
			return `( d.startTime <= {nwts '${this.to.toISOString()}'} AND d.endTime >= {nwts '${this.from.toISOString()}'} )`;
		} else {
			return "";
		}
	}

	public getFiltersSubQuery() {
		let filters = "";

		if (!this.showAll) {
			if (this.showUndeclared && this.showDeclared) {
				filters += " AND (d.activity IS NOT NULL OR d.activity IS NULL)";
			} else {
				if (this.showDeclared) {
					filters += " AND d.activity IS NOT NULL";
				}
				if (this.showUndeclared) {
					filters += " AND d.activity IS NULL";
				}
			}

			if (this.showOngoing) {
				filters += " AND d.endTime IS NULL";
			}
		}
		return filters;
	}
}
