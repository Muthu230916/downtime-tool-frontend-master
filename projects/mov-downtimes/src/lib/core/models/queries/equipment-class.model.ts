import { Base } from "./base.model";

export class EquipmentClass extends Base {
	id: string;
	hasEquipment?: "true" | "false";
	equipmentId?: string; // used when retreiving activities for equipment classes
	description?: string;
	languageID?: string;
}
