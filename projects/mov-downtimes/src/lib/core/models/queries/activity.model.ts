import { Base } from "./base.model";

export class Activity extends Base {
	name: string;
	color: string;
	allowance: number;
	maximumAllowance: number;
	automatedCode: string;
	sapPMCode: string;
	sapDowntimeCode: string;
	isActive: string;
	isSolutionMandatory: string;
	isCauseMandatory: string;
	nested: string;
	totalcount?: string;
	hasChildren?: boolean;
	parentActivity?: string;
	equipment?: string;
}
