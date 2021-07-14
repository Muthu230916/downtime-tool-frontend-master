import { Localization } from "../../interfaces/localization";
import { CauseDetails } from "../details/cause.details.model";
import { SolutionDetails } from "../details/solution.details.model";
import { ActivityDetails } from "../details/activity.details";

export class ActivityProcess {
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
	public nameIds?: number[];

	fromDetails(activity: ActivityDetails) {
		this.activityId = activity.activityId;
		this.sapPMCode = activity.sapPMCode;
		this.sapDowntimeCode = activity.sapDowntimeCode;
		this.allowance = activity.allowance;
		this.maximumAllowance = activity.maximumAllowance;
		this.automatedCode = activity.automatedCode;
		this.color = activity.color;
		this.isActive = activity.isActive;
		this.isCauseMandatory = activity.isCauseMandatory;
		this.isSolutionMandatory = activity.isSolutionMandatory;
		this.isSystemActive = activity.isSystemActive;
		this.descriptions = activity.descriptions;
		this.names = activity.names;
		this.causes = activity.causes;
		this.solutions = activity.solutions;
		this.parentActivity = activity.parentActivity;
		this.nameIds = activity.nameIds;
	}
}
