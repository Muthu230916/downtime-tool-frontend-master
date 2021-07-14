import { Component, Input } from "@angular/core";

@Component({
	selector: "lib-downtimes-confirmation-modal",
	templateUrl: "./confirmation-modal.component.html"
})
export class ConfirmationModalComponent {
	@Input() public title: "";
	@Input() public body: "";

	constructor() {}

	public confirm() {}

	public cancel() {}
}
