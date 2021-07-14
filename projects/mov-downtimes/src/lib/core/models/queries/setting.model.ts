export class SimpleSetting {
	customizingId: string;
	customizingValue: string;
}

export enum SettingEnum {
	useveri95Equipments = "useveri95Equipments",
	useveri95MaterialLots = "useveri95MaterialLots",
	masterIncludeOverlappingDot = "masterIncludeOverlappingDot",
	masterXHours = "masterXHours",
	masterXLast = "masterXLast",
	masterShowUndeclared = "masterShowUndeclared",
	masterSolution = "masterSolution",
	masterCause = "masterCause",
	masterLocation = "masterLocation",
	masterDotPerPage = "masterDotPerPage"
}

export interface Setting {
	useveri95Equipments: boolean;
	useveri95MaterialLots: boolean;
	masterIncludeOverlappingDot: boolean;
	masterXHours: number;
	masterXLast: number;
	masterShowUndeclared: boolean;
	masterSolution: boolean;
	masterCause: boolean;
	masterLocation: boolean;
	masterDotPerPage: number;
}
