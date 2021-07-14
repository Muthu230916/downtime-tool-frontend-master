import { Component, OnInit, ViewChild, OnDestroy } from "@angular/core";
import { TranslateService } from "@movilitas/mov-base";
import { MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { SolutionsService } from "../../core/services/solutions.service";
import { CausesService } from "../../core/services/causes.service";
import { MatSort } from "@angular/material/sort";
import { Cause } from "../../core/models/queries/cause.model";
import { Subscription } from "rxjs";
import { MatDialog } from "@angular/material/dialog";
import { CauseProcess } from "../../core/models/process/cause.process.model";
import { SolutionProcess } from "../../core/models/process/solution.process.model";
import { Solution } from "../../core/models/queries/solution.model";
import { LocalizationModalComponent } from "../../shared/modals/localization-modal/localization-modal.component";
import { LocalizationModalConfig } from "../../core/interfaces/localization-modal-config";
import { LanguageCodes } from "../../core/enums/language-codes.enum";

@Component({
	selector: "lib-downtimes-causes-solutions",
	templateUrl: "./causes-solutions.component.html",
	styleUrls: ["./causes-solutions.component.css"],
})
export class CausesSolutionsComponent implements OnInit, OnDestroy {
	public causesColumns: string[] = ["name", "createdon", "star"];
	public solutionsColumns: string[] = ["name", "createdon", "star"];

	public causesDataSource: MatTableDataSource<Cause>;
	public solutionsDataSource: MatTableDataSource<Cause>;

	@ViewChild("causesPaginator", { read: MatPaginator, static: false })
	causesPaginator: MatPaginator;
	@ViewChild(MatSort, { read: false, static: false }) causesSort: MatSort;

	@ViewChild("solutionsPaginator", { read: false, static: false })
	solutionsPaginator: MatPaginator;
	@ViewChild(MatSort, { read: false, static: false }) solutionsSort: MatSort;

	private causesSubscription: Subscription;
	private solutionsSubscription: Subscription;

	constructor(
		private causesService: CausesService,
		private solutionsService: SolutionsService,
		private translateService: TranslateService,
		public dialog: MatDialog
	) {}

	ngOnInit() {
		this.causesSubscription = this.causesService.all$.subscribe((data) => {
			if (data.length > 0) {
				this.causesDataSource = new MatTableDataSource(data);
				// this.selection = new SelectionModel(true, []);
				// this.causesDataSource.selection = this.selection;
				this.causesDataSource.sort = this.causesSort;
				// this.causesPaginator.length = +data[data.length - 1]["uiid"];
				this.causesDataSource.paginator = this.causesPaginator;
			}
		});

		this.solutionsSubscription = this.solutionsService.all$.subscribe((data) => {
			if (data.length > 0) {
				this.solutionsDataSource = new MatTableDataSource(data);
				// this.selection = new SelectionModel(true, []);
				// this.causesDataSource.selection = this.selection;
				this.solutionsDataSource.sort = this.solutionsSort;
				// this.solutionsPaginator.length = data[data.length - 1]["totalcount"];
				this.solutionsDataSource.paginator = this.solutionsPaginator;
			}
		});

		this.causesService.getAll(LanguageCodes.English, 0, 999);
		this.solutionsService.getAll(LanguageCodes.English, 0, 999);
	}

	public addNewCause() {
		this.localizationModal(new CauseProcess(), "cause");
	}

	public editCause(cause: Cause) {
		this.causesService.causeToUpdateObject(cause).then((causeToUpdate) => {
			this.localizationModal(causeToUpdate, "cause");
		});
	}

	private localizationModal(modelToUpdate: CauseProcess | SolutionProcess, subjectTitle: string) {
		const data: LocalizationModalConfig = { data: modelToUpdate.names, subjectTitle };
		const dialogRef = this.dialog.open(LocalizationModalComponent, {
			width: "650px",
			data,
		});
		dialogRef.afterClosed().subscribe((model) => {
			if (model) {
				modelToUpdate.names = model.data;
				if (modelToUpdate instanceof CauseProcess) {
					this.causesService.save(modelToUpdate).subscribe(() => {
						this.causesService.getAll(LanguageCodes.English, 0, 999);
					});
				}
				if (modelToUpdate instanceof SolutionProcess) {
					this.solutionsService.save(modelToUpdate).subscribe(() => {
						this.solutionsService.getAll(LanguageCodes.English, 0, 999);
					});
				}
			}
		});
	}

	public addNewSolution() {
		this.localizationModal(new SolutionProcess(), "solution");
	}

	public editSolution(solution: Solution) {
		this.solutionsService.solutionToUpdateObject(solution).then((solutionToUpdate) => {
			this.localizationModal(solutionToUpdate, "solution");
		});
	}

	public deleteCause(model: Cause) {
		if (confirm(this.translateService.get("DELETE") + "? " + model.name)) {
			this.causesService.remove(+model.uiid).subscribe(() => {
				this.causesService.getAll(LanguageCodes.English, 0, 999);
			});
		}
	}

	public deleteSolution(model: Cause) {
		if (confirm(this.translateService.get("DELETE") + "? " + model.name)) {
			this.solutionsService.remove(+model.uiid).subscribe(() => {
				this.solutionsService.getAll(LanguageCodes.English, 0, 999);
			});
		}
	}

	ngOnDestroy() {
		this.causesSubscription.unsubscribe();
		this.solutionsSubscription.unsubscribe();
	}
}
