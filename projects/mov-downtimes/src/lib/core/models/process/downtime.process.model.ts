export class DowntimeProcess {
	activityId?: string;
	cause?: { causeId: string };
	downtimeId?: string;
	endTime: string;
	equipmentId: { id: string; type: string };
	solution?: { solutionId: string };
	// comment?: string;
	startTime: string;
	team?: { teamId: string };
	duration?: string;
	isSplit: string;
}
