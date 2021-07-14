import { Localization } from "../../interfaces/localization";
import { EquipmentId } from "../../interfaces/equipment-id";
import { Base } from "./base.details.model";
import { EquipmentLocationDetails } from "./equipment-location.details";

export class EquipmentDetails extends Base {
	public names: Localization[];
	public equipmentId: EquipmentId;
	public activitiesIds?: number[];
	public downtimeIds?: number[];
	public locations: EquipmentLocationDetails[];
}
