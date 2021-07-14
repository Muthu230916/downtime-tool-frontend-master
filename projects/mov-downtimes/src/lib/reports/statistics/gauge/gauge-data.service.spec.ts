import { GaugeDataService } from "./gauge-data.service";
import { DateTimeService } from "../../../core/services/date-time.service";
import { StatisticsModel } from "../../../core/models/queries/statistics-container.model";
import { ShowDowntimeItem } from "../../../core/models/queries/downtime.model";
import { Activity } from "../../../core/models/queries/activity.model";

describe("ReportsSearchModel", () => {
	const mockedTranslationService = jasmine.createSpyObj("TranslateService", ["get"]);

	mockedTranslationService.get.and.callFake((text) => {
		return text;
	});

	let service: GaugeDataService;

	const statisticsModel = new StatisticsModel();

	function getStatisticsModel() {
		statisticsModel.selection = {
			activity: "", // activity: "Activity1" it should throw error
			dateFrom: "2019-11-27T23:00:00.936Z",
			dateTo: "2019-12-05T22:59:59.936Z",
			dynamicDaily: false,
			dynamicWeekly: false,
			equipments: [],
			timeFilterType: "DATE",
		};
	}

	const donwtimes: ShowDowntimeItem[] = [
		{
			Activity: "undeclared",
			Duration: "",
			ID: "1",
			Start: "2019-11-01T19:00:00+01:00",
			Stop: "",
			Team: "",
			User: "x",
			WorkCenter: "Equipment1",
			activityId: "",
			causeName: "",
			isDeclared: false,
			solutionName: "",
		},
		{
			Activity: "undeclared",
			Duration: "",
			ID: "1",
			Start: "2019-10-01T19:00:00+01:00",
			Stop: "",
			Team: "",
			User: "x",
			WorkCenter: "Equipment2",
			activityId: "",
			causeName: "",
			isDeclared: false,
			solutionName: "",
		},
		{
			Activity: "TestAct1",
			Duration: "408:54:09",
			ID: "2",
			Start: "2019-11-01T19:00:00+01:00",
			Stop: "2020-10-31T19:13:41+01:00",
			Team: "",
			User: "x",
			WorkCenter: "Equipment2",
			activityId: "1",
			causeName: "",
			isDeclared: true,
			solutionName: "",
		},
		{
			Activity: "TestAct2",
			Duration: "408:54:09",
			ID: "3",
			Start: "2019-11-01T19:00:00+01:00",
			Stop: "2020-10-31T19:13:41+01:00",
			Team: "",
			User: "x",
			WorkCenter: "Equipment2",
			activityId: "2",
			causeName: "",
			isDeclared: true,
			solutionName: "",
		},
		{
			Activity: "undeclared",
			Duration: "",
			ID: "4",
			Start: "2019-11-01T19:00:00+01:00",
			Stop: "",
			Team: "",
			User: "x",
			WorkCenter: "Equipment3",
			activityId: "",
			causeName: "",
			isDeclared: false,
			solutionName: "",
		},
	];

	const activities: Activity[] = [
		{
			allowance: 2,
			automatedCode: "2",
			color: "#ec8ab9",
			isActive: "true",
			isCauseMandatory: "false",
			isSolutionMandatory: "false",
			maximumAllowance: 2,
			name: "TestAct1",
			parentActivity: "",
			sapDowntimeCode: "",
			sapPMCode: "",
			uiid: "1",
			nested: "true",
		},
		{
			allowance: 2,
			automatedCode: "2",
			color: "#ec8ab9",
			isActive: "true",
			isCauseMandatory: "false",
			isSolutionMandatory: "false",
			maximumAllowance: 2,
			name: "TestAct2",
			parentActivity: "1",
			sapDowntimeCode: "",
			sapPMCode: "",
			uiid: "2",
			nested: "",
		},
	];

	function filterDowntimesByEquipments() {
		return donwtimes.filter((d) => statisticsModel.selection.equipments.includes(d.WorkCenter));
	}

	beforeEach(() => {
		getStatisticsModel();
		service = new GaugeDataService(new DateTimeService(), mockedTranslationService);
	});

	describe("getGaugeData()", () => {
		it("should return total uptime and downtime, with 100% uptime", () => {
			statisticsModel.selection.activity = "";
			statisticsModel.selection.equipments = ["Equipment4"];

			const expectedResult = {
				entries: [
					{
						extra: {},
						name: "UPTIME: 191:59:59 (100.00%)",
						value: 691199,
					},
					{
						extra: {
							isTotalDowntime: true,
						},
						name: "DOWNTIME: 00:00:00 (0.00%)",
						value: 0,
					},
				],
				totalValue: 691199,
			};

			const result = service.getGaugeData(
				statisticsModel,
				filterDowntimesByEquipments(),
				activities
			);

			expect(result).toEqual(expectedResult);
		});

		it("should return total uptime and downtime, with 100% downtime", () => {
			statisticsModel.selection.activity = "";
			statisticsModel.selection.equipments = ["Equipment1"];

			const expectedResult = {
				entries: [
					{
						extra: {},
						name: "UPTIME: 00:00:00 (0.00%)",
						value: 0,
					},
					{
						extra: {
							isTotalDowntime: true,
						},
						name: "DOWNTIME: 191:59:59 (100.00%)",
						value: 691199,
					},
				],
				totalValue: 691199,
			};

			const result = service.getGaugeData(
				statisticsModel,
				filterDowntimesByEquipments(),
				activities
			);

			expect(result).toEqual(expectedResult);
		});

		it("should return downtime for selected undeclared downtime activity as 100% undeclared", () => {
			statisticsModel.selection.activity = "ROOT";
			statisticsModel.selection.equipments = ["Equipment3"];

			const expectedResult = {
				entries: [
					{
						extra: {},
						name: "UNDECLARED: 191:59:59 (100.00%)",
						value: 691199,
					},
				],
				totalValue: 691199,
			};

			const result = service.getGaugeData(
				statisticsModel,
				filterDowntimesByEquipments(),
				activities
			);

			expect(result).toEqual(expectedResult);
		});

		it("should return downtime for selected undeclared downtime activity as partially undeclared", () => {
			statisticsModel.selection.activity = "ROOT";
			statisticsModel.selection.equipments = ["Equipment2"];

			const expectedResult = {
				entries: [
					{
						extra: {},
						name: "UNDECLARED: 191:59:59 (33.33%)",
						value: 691199,
					},
					{
						extra: {
							activity: { id: "1", color: "#ec8ab9" },
						},
						name: "TestAct1: 383:59:58 (66.67%)",
						value: 1382398,
					},
				],
				totalValue: 2073597,
			};

			const result = service.getGaugeData(
				statisticsModel,
				filterDowntimesByEquipments(),
				activities
			);

			expect(result).toEqual(expectedResult);
		});

		it("should return downtime for selected child activity", () => {
			statisticsModel.selection.activity = "1";
			statisticsModel.selection.equipments = ["Equipment2"];

			const expectedResult = {
				entries: [
					{
						extra: {
							activity: { id: "2", color: "#ec8ab9" },
						},
						name: "TestAct2: 191:59:59 (100.00%)",
						value: 691199,
					},
				],
				totalValue: 691199,
			};

			const result = service.getGaugeData(
				statisticsModel,
				filterDowntimesByEquipments(),
				activities
			);

			expect(result).toEqual(expectedResult);
		});
	});
});
