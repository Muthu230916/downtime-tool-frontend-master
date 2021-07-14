import { Base } from "./base.details.model";
import { Localization } from "../../interfaces/localization";

export class EquipmentLocationDetails extends Base {
	locationId: number;
	nameIds: number[];
	names: Localization[];
}
