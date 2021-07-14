import { Localization } from "../../interfaces/localization";
import { EquipmentId } from "../../interfaces/equipment-id";

export class EquipmentLocationProcess {
	constructor() {
		this.names = [];
	}

	public equipmentId: EquipmentId;
	public locationId: string;
	public names: Localization[];
}
