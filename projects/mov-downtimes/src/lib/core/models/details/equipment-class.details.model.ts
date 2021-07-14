import { Localization } from "../../interfaces/localization";
import { EquipmentId } from "../../interfaces/equipment-id";
import { Base } from "./base.details.model";

export class EquipmentClassCreateUpdate extends Base {
	public names: Localization[];
	public equipmentId: EquipmentId;
	public activitiesIds?: number[];
}
