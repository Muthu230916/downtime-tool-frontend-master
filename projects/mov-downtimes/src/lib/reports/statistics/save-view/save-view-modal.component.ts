import { Component, OnInit, ViewChild, OnDestroy, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { LanguageCodes } from "../../../core/enums/language-codes.enum";
import { LocalizationModalConfig } from "../../../core/interfaces/localization-modal-config";

@Component({
	selector: "lib-downtimes-save-view-modal",
	templateUrl: "./save-view-modal.component.html",
	styleUrls: ["./save-view-modal.component.css"]
})
export class SaveViewModalComponent implements OnInit, OnDestroy {
	public title = "Save view";
	public languageCodes = Object.keys(LanguageCodes).map(key => ({
		code: LanguageCodes[key],
		name: key
	}));

	public name: string;
	public shared = true;

	constructor(
		public dialogRef: MatDialogRef<SaveViewModalComponent>,
		@Inject(MAT_DIALOG_DATA) public model: LocalizationModalConfig
	) {}

	public onCancel() {
		this.dialogRef.close();
	}

	public save() {
		this.dialogRef.close({ name: this.name, shared: this.shared });
	}

	ngOnInit() {}

	ngOnDestroy() {}
}
