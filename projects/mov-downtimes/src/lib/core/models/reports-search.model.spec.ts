import { ReportsSearchModel } from "./reports-search.model";

describe("ReportsSearchModel", () => {
	let model: ReportsSearchModel;

	beforeEach(() => {
		model = new ReportsSearchModel();
	});

	describe("getEquipmentsSubQuery()", () => {
		it("subquery should return string containing equipments joined from equipmentsSelected array", () => {
			model.equipmentsSelected = [{ id: "Equipment1" }, { id: "Equipment2" }];

			expect(model.getEquipmentsSubQuery()).toBe(
				"( e.equipmentId.id = 'Equipment1' OR e.equipmentId.id = 'Equipment2' )"
			);
		});

		it("it should return empty string if equipmentsSelected array is empty", () => {
			model.equipmentsSelected = [];

			expect(model.getEquipmentsSubQuery()).toBe("");
		});
	});

	describe("getDateTimePeriodSubQuery()", () => {
		it("subquery should return string containing period in specified dates", () => {
			model.from = new Date("2000/01/01");
			model.from.setHours(0);
			model.from.setMinutes(0);
			model.from.setSeconds(0);

			model.to = new Date("2020/12/31");
			model.to.setHours(23);
			model.to.setMinutes(59);
			model.to.setSeconds(59);

			expect(model.getDateTimePeriodSubQuery()).toBe(
				"( d.startTime <= {nwts '2020-12-31T22:59:59.000Z'} AND d.endTime >= {nwts '1999-12-31T23:00:00.000Z'} )"
			);
		});

		it("it should return empty string if no from and to period dates specified", () => {
			model.from = undefined;
			model.to = undefined;

			expect(model.getDateTimePeriodSubQuery()).toBe("");
		});
	});

	describe("getFiltersSubQuery()", () => {
		it("if both declared and undeclared is true then it should return string containing declared and undeclared set to true", () => {
			model.showAll = false;
			model.showDeclared = true;
			model.showUndeclared = true;

			expect(model.getFiltersSubQuery()).toBe(
				" AND (d.activity IS NOT NULL OR d.activity IS NULL)"
			);
		});

		it("if declared is true then it should return string containing only declared set to true", () => {
			model.showAll = false;
			model.showDeclared = true;

			expect(model.getFiltersSubQuery()).toBe(" AND d.activity IS NOT NULL");
		});

		it("if undeclared is true then it should return string containing only undeclared set to true", () => {
			model.showAll = false;
			model.showUndeclared = true;

			expect(model.getFiltersSubQuery()).toBe(" AND d.activity IS NULL");
		});
	});
});
