import { EquipmentId } from "../../interfaces/equipment-id";

export class EquipmentOrClassProcess {
	equipmentId: EquipmentId;
	isLocationMandatory: boolean;
	type: "EQUIPMENTCLASS" | "EQUIPMENT";
}
