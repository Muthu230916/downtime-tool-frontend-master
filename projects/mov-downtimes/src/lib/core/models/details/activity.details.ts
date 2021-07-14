import { Localization } from "../../interfaces/localization";
import { CauseDetails } from "./cause.details.model";
import { SolutionDetails } from "./solution.details.model";
import { Base } from "./base.details.model";

export class ActivityDetails extends Base {
	public activityId?: number;
	public sapPMCode: string;
	public sapDowntimeCode: string;
	public allowance: number;
	public maximumAllowance: number;
	public automatedCode: string;
	public color: string;
	public isActive: boolean;
	public isCauseMandatory: boolean;
	public isSolutionMandatory: boolean;
	public isSystemActive: boolean;
	public descriptions?: Localization[];
	public names?: Localization[];
	public causes?: CauseDetails[];
	public solutions?: SolutionDetails[];
	public parentActivity?: number;
	public nestingLevel?: number;
	public nestedActivities?: number[];
	public nestedActivityPaths?: string[];
	public nameIds?: number[];

	constructor() {
		super();

		this.activityId = undefined;
		this.sapPMCode = "";
		this.sapDowntimeCode = "";
		this.allowance = undefined;
		this.maximumAllowance = undefined;
		this.automatedCode = "";
		this.color = "#000000";
		this.isActive = false;
		this.isCauseMandatory = false;
		this.isSolutionMandatory = false;
		this.isSystemActive = false;
		this.descriptions = undefined;
		this.names = undefined;
		this.causes = undefined;
		this.solutions = undefined;
		this.parentActivity = undefined;
		this.nestingLevel = undefined;
	}
}
