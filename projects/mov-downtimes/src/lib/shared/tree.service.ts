import { Injectable } from "@angular/core";
import { of, Subject } from "rxjs";
import { TreeNode } from "angular-tree-component";
import { distinctUntilChanged } from "rxjs/operators";
import { Activity } from "../core/models/queries/activity.model";

@Injectable({
	providedIn: "root"
})
export class TreeService {
	private dblClickSubject: Subject<Activity> = new Subject<Activity>();

	public dblClick$ = this.dblClickSubject.asObservable().pipe(distinctUntilChanged());

	public onDblClick(node: TreeNode) {
		const activity = node.data as Activity;
		this.dblClickSubject.next(activity);
	}
}
