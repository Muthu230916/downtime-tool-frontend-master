import { EquipmentId } from "../../interfaces/equipment-id";

export class AssignEquipmentOrClassProcess {
	public activityId: number;
	public equipmentId: EquipmentId;
	public allowance: number;
	public maximumAllowance: number;
	public machineCode: number;
	public equipmentAssociationId: number;

	public fromApi(existingAssociation: any) {
		this.equipmentAssociationId = existingAssociation.equipmentAssociationId;
		this.machineCode = existingAssociation.machineCode;
		this.allowance = +existingAssociation.allowance;
		this.maximumAllowance = +existingAssociation.maximumAllowance;
	}
}
