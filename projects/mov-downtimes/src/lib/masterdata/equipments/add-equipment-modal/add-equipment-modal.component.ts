import { Component, OnInit, OnDestroy, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { LanguageCodes } from "../../../core/enums/language-codes.enum";
import { EquipmentOrClassProcess } from "../../../core/models/process/equipment-or-class.process.model";

@Component({
	selector: "lib-downtimes-add-equipment-modal",
	templateUrl: "./add-equipment-modal.component.html",
	styleUrls: ["./add-equipment-modal.component.css"]
})
export class AddEquipmentModalComponent implements OnInit, OnDestroy {
	public title = "Add new equipment";
	public model: EquipmentOrClassProcess = new EquipmentOrClassProcess();

	constructor(public dialogRef: MatDialogRef<AddEquipmentModalComponent>) {
		this.model.equipmentId = { id: "", type: "EQUIPMENT" };
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
