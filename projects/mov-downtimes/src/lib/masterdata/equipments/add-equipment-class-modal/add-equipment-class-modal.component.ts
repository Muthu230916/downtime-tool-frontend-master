import { Component, OnInit, OnDestroy, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { EquipmentOrClassProcess } from "../../../core/models/process/equipment-or-class.process.model";

@Component({
	selector: "lib-downtimes-add-equipment-class-modal",
	templateUrl: "./add-equipment-class-modal.component.html",
	styleUrls: ["./add-equipment-class-modal.component.css"]
})
export class AddEquipmentClassModalComponent implements OnInit, OnDestroy {
	public title = "Add new equipment class";
	public model: EquipmentOrClassProcess = new EquipmentOrClassProcess();

	constructor(public dialogRef: MatDialogRef<AddEquipmentClassModalComponent>) {
		this.model.equipmentId = { id: "", type: "EQUIPMENTCLASS" };
	}

	public onCancel() {
		this.dialogRef.close();
	}

	public onSave() {
		this.dialogRef.close(this.model);
	}

	ngOnInit() {}

	ngOnDestroy() {}
}
