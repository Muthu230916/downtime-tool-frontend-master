import moment from "moment";
import { TestBed, getTestBed } from "@angular/core/testing";
import { DateTimeService } from "./date-time.service";

describe("DateTimeService", () => {
	let service: DateTimeService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [DateTimeService]
		});

		const injector = getTestBed();
		service = injector.get(DateTimeService);
	});

	describe("toDurationString", () => {
		it("Should return all zeros", () => {
			const duration = moment.duration(0, "seconds");

			expect(service.toDurationString(duration)).toEqual("00:00:00");
		});

		it("Should return seconds correctly", () => {
			const duration = moment.duration(1, "seconds");
			const duration1 = moment.duration(10, "seconds");
			const duration2 = moment.duration(11, "seconds");

			expect(service.toDurationString(duration)).toEqual("00:00:01");
			expect(service.toDurationString(duration1)).toEqual("00:00:10");
			expect(service.toDurationString(duration2)).toEqual("00:00:11");
		});

		it("Should return minutes", () => {
			const duration = moment.duration(60, "seconds");
			const duration1 = moment.duration(600, "seconds");
			const duration2 = moment.duration(660, "seconds");

			expect(service.toDurationString(duration)).toEqual("00:01:00");
			expect(service.toDurationString(duration1)).toEqual("00:10:00");
			expect(service.toDurationString(duration2)).toEqual("00:11:00");
		});

		it("Should return hours", () => {
			const duration = moment.duration(3600, "seconds");
			const duration1 = moment.duration(36000, "seconds");
			const duration2 = moment.duration(39600, "seconds");
			const duration3 = moment.duration(360000, "seconds");
			const duration4 = moment.duration(399600, "seconds");

			expect(service.toDurationString(duration)).toEqual("01:00:00");
			expect(service.toDurationString(duration1)).toEqual("10:00:00");
			expect(service.toDurationString(duration2)).toEqual("11:00:00");
			expect(service.toDurationString(duration3)).toEqual("100:00:00");
			expect(service.toDurationString(duration4)).toEqual("111:00:00");
		});

		it("Should return hours and minutes and seconds", () => {
			const duration = moment.duration(661, "seconds");
			const duration1 = moment.duration(670, "seconds");
			const duration2 = moment.duration(671, "seconds");
			const duration3 = moment.duration(360001, "seconds");
			const duration4 = moment.duration(360010, "seconds");
			const duration5 = moment.duration(360011, "seconds");
			const duration6 = moment.duration(360060, "seconds");
			const duration7 = moment.duration(360600, "seconds");
			const duration8 = moment.duration(360660, "seconds");
			const duration9 = moment.duration(400271, "seconds");

			expect(service.toDurationString(duration)).toEqual("00:11:01");
			expect(service.toDurationString(duration1)).toEqual("00:11:10");
			expect(service.toDurationString(duration2)).toEqual("00:11:11");
			expect(service.toDurationString(duration3)).toEqual("100:00:01");
			expect(service.toDurationString(duration4)).toEqual("100:00:10");
			expect(service.toDurationString(duration5)).toEqual("100:00:11");
			expect(service.toDurationString(duration6)).toEqual("100:01:00");
			expect(service.toDurationString(duration7)).toEqual("100:10:00");
			expect(service.toDurationString(duration8)).toEqual("100:11:00");
			expect(service.toDurationString(duration9)).toEqual("111:11:11");
		});
	});
});
