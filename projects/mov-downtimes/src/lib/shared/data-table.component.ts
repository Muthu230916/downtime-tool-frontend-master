import { Component, Input, OnInit, OnDestroy, ViewChild, AfterViewInit } from "@angular/core";
import { BaseComponent } from "./base/base.component";
import { LocalizationService } from "../core/services/localization.service";
import { DataProxyService } from "../core/services/data-proxy.service";
import { MatPaginator } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { SelectionModel } from "@angular/cdk/collections";

import { default as veri95model } from "../core/models/entitiesMetadata.json";

// Do we need to remove this is is used somewhere ?
@Component({
	selector: "lib-downtimes-data-table",
	templateUrl: "./data-table.component.html",
	styleUrls: ["./data-table.component.css"],
})
export class DataTableComponent extends BaseComponent implements OnInit {
	constructor(private dataService: DataProxyService, public langServ: LocalizationService) {
		super(langServ);
	}

	@Input()
	public columnsToShow: string[];

	public result: [] = [];
	public columnsInformation: { id: number; name: string }[] = [];
	// displayedColumns: string[] = ['position', 'name', 'weight', 'symbol'];

	public displayedColumns: string[] = [];
	// dataSource = new MatTableDataSource<PeriodicElement>(ELEMENT_DATA);
	// selection = new SelectionModel<PeriodicElement>(true, []);

	public dataSource = null;
	public selection; // = new SelectionModel<any>(true, []);

	public jpql: string;
	public model: [
		{
			entity: string;
			class: string;
			table: string;
			attributes: [{ name: string; isId: boolean; linkType: string; type: string }];
		}
	];

	@ViewChild(MatPaginator, { read: false, static: false }) paginator: MatPaginator;
	@ViewChild(MatSort, { read: false, static: false }) sort: MatSort;

	/** Whether the number of selected elements matches the total number of rows. */
	public isAllSelected() {
		const numSelected = this.selection.selected.length;
		const numRows = this.dataSource.data.length;
		return numSelected === numRows;
	}

	/** Selects all rows if they are not all selected; otherwise clear selection. */
	public masterToggle() {
		this.isAllSelected()
			? this.selection.clear()
			: this.dataSource.data.forEach((row) => this.selection.select(row));
	}

	/** The label for the checkbox on the passed row */
	public checkboxLabel(row?: any): string {
		if (!row) {
			return `${this.isAllSelected() ? "select" : "deselect"} all`;
		}
		return `${this.selection.isSelected(row) ? "deselect" : "select"} row ${row.position + 1}`;
	}

	public applyFilter(filterValue: string) {
		this.dataSource.filter = filterValue.trim().toLowerCase();
	}

	public ngOnInit() {
		this.model = <any>veri95model;
		const metadata = this.model.filter((o) => o.entity === "Equipment");

		this.jpql = "select ";
		let i = 0;
		const columns: string[] = [];

		columns.push(name["select"]);
		for (const name of metadata[0].attributes) {
			if (metadata[0].attributes[i].linkType === "") {
				columns.push(name["name"]);
				this.columnsInformation.push({ id: i, name: name["name"] });
				this.jpql += "o." + name["name"] + ", ";
			}
			i++;
		}
		// remove the last comma
		this.jpql = this.jpql.slice(0, -1);
		this.jpql = this.jpql.slice(0, -1);

		this.jpql += " from " + metadata[0].entity + " o";
		this.onSelection(this.jpql, columns);
	}

	public onSelection(selection: string, columns: string[]) {
		this.dataService.getData(selection).subscribe((res: any[]) => {
			if (res) {
				//       this.result = res;
				this.dataSource = new MatTableDataSource(res);
				this.selection = new SelectionModel(true, []);
				this.dataSource.selection = this.selection;
				this.dataSource.sort = this.sort;
				this.dataSource.paginator = this.paginator;

				this.displayedColumns = columns;
			} else {
			}
		});
	}
}
