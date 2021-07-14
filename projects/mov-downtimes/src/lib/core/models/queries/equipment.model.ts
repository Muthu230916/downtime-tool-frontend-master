import { Base } from "./base.model";

export class Equipment extends Base {
	id: string;
	hasEquipment?: "true" | "false";
	description?: string;
	languageID?: string;
}
