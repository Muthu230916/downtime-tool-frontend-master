import { Component, OnInit, ViewChild, OnDestroy, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { LanguageCodes } from "../../../core/enums/language-codes.enum";
import { LocalizationModalConfig } from "../../../core/interfaces/localization-modal-config";
import { StatisticsContainerModel } from "../../../core/models/queries/statistics-container.model";
import { MatTableDataSource } from "@angular/material/table";
import { ReportsService } from "../../../core/services/reports.service";

@Component({
	selector: "lib-downtimes-views-modal",
	templateUrl: "./views-modal.component.html",
	styleUrls: ["./views-modal.component.css"]
})
export class ViewsModalComponent implements OnInit, OnDestroy {
	public title = "Load statistics view";
	public languageCodes = Object.keys(LanguageCodes).map(key => ({
		code: LanguageCodes[key],
		name: key
	}));

	public viewsColumns: string[] = ["name", "createdon", "createdby", "star"];
	public viewsDataSource: MatTableDataSource<StatisticsContainerModel>;

	constructor(
		private reportsService: ReportsService,
		public dialogRef: MatDialogRef<ViewsModalComponent>,
		@Inject(MAT_DIALOG_DATA) public model: LocalizationModalConfig
	) {}

	public deleteView(view: StatisticsContainerModel) {
		if (confirm("Delete statistics view? " + view.name)) {
			this.reportsService.deleteView(view.uiid).subscribe(() => {
				this.getViews();
			});
		}
	}

	public onCancel() {
		this.dialogRef.close();
	}

	public loadView(model: StatisticsContainerModel) {
		this.dialogRef.close(model);
	}

	ngOnInit() {
		this.getViews();
	}

	private getViews() {
		this.reportsService.getViews().subscribe(data => {
			if (data.length > 0) {
				this.viewsDataSource = new MatTableDataSource(data);
			} else {
				this.viewsDataSource = new MatTableDataSource([]);
			}
		});
	}

	ngOnDestroy() {}
}
