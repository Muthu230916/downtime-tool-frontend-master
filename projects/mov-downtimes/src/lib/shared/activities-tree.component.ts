import {
	Component,
	Input,
	OnInit,
	OnDestroy,
	ViewChild,
	Output,
	EventEmitter
} from "@angular/core";
import { TreeNode } from "../core/interfaces/TreeNode";
import { ActivitiesService } from "../core/services/activities.service";
import { Subscription } from "rxjs";
import { TREE_ACTIONS, KEYS, TreeComponent } from "angular-tree-component";
import { TreeService } from "./tree.service";
import { fadeInLeftBigOnEnterAnimation } from "angular-animations";
import { LanguageCodes } from "../core/enums/language-codes.enum";

@Component({
	selector: "lib-downtimes-activities-tree",
	animations: [
		fadeInLeftBigOnEnterAnimation({
			anchor: "enter",
			duration: 500,
			delay: 0,
			translate: "30px"
		})
	],
	templateUrl: "./activities-tree.component.html",
	styleUrls: ["./activities-tree.component.css"]
})
export class ActivitiesTreeComponent implements OnInit, OnDestroy {
	@Input()
	public options?: {};

	@Output() public selectedNodeId = new EventEmitter<number>();

	@ViewChild(TreeComponent, { read: false, static: false }) public activitiesTree!: TreeComponent;

	public model: TreeNode[] = [];

	private treeDefaultOptions = {
		displayField: "name",
		isExpandedField: "expanded",
		idField: "id",
		hasChildrenField: "hasChildren",
		childrenField: "children",
		getChildren: async (node: TreeNode) => {
			let childrenForNode: TreeNode[] = [];

			await this.activitiesService
				.getByParentId(node.id, LanguageCodes.English)
				.toPromise()
				.then(data => {
					childrenForNode = this.activitiesService.getActivitiesAsTreeNodes(data);
				});

			if (this.focusOrAssociationMode) {
				this.conditionalFocus(childrenForNode);
			}

			return this.sortNodesByName(childrenForNode);
		},
		actionMapping: {
			mouse: {
				click: (tree, node, $event) => {
					this.onClick(node.data.id);
					TREE_ACTIONS.TOGGLE_ACTIVE(tree, node, $event);
				},
				expanderClick: (tree, node, $event) => {
					if (node.hasChildren) {
						TREE_ACTIONS.TOGGLE_EXPANDED(tree, node, $event);
					}
				}
			},
			keys: {
				[KEYS.ENTER]: (tree, node, $event) => {
					node.expandAll();
				}
			}
		},
		nodeHeight: 23,
		allowDrag: false,
		allowDrop: false,
		allowDragoverStyling: true,
		levelPadding: 10,
		useVirtualScroll: true,
		animateExpand: true,
		scrollOnActivate: true,
		animateSpeed: 0,
		animateAcceleration: 0,
		scrollContainer: document.documentElement // HTML
	};

	private rootActivitiesSubscription: Subscription;
	private refreshTreeSubscription: Subscription;
	private focusedNodesSubscription: Subscription;
	private clearFocusSubscription: Subscription;

	private focusOrAssociationMode = false;
	private associationModeIds: string[];

	constructor(private activitiesService: ActivitiesService) {}

	public ngOnInit() {
		this.rootActivitiesSubscription = this.activitiesService.rootActivities$.subscribe(data => {
			this.model = this.sortNodesByName(
				this.activitiesService.getActivitiesAsTreeNodes(data)
			);
			this.runPreChecks();
		});
		this.activitiesService.sync(LanguageCodes.English);

		if (!this.options) {
			this.options = this.treeDefaultOptions;
		}

		this.refreshTreeSubscription = this.activitiesService.refreshTree$.subscribe(() => {
			this.refreshTree();
		});

		this.clearFocusSubscription = this.activitiesService.clearFocus$.subscribe(() => {
			this.disableFocusOrAssociationMode();
		});

		this.focusedNodesSubscription = this.activitiesService.focusedNodes$.subscribe(
			specificNodes => {
				this.focusNodes(specificNodes);
			}
		);
	}

	private sortNodesByName(nodes: TreeNode[]) {
		nodes.sort((a, b) => {
			return a.name.localeCompare(b.name);
		});

		return nodes;
	}

	private runPreChecks() {
		if (this.focusOrAssociationMode) {
			this.focusNodes(this.associationModeIds);
		}
	}

	public focusNodes(specificNodes: string[]) {
		if (this.activitiesTree.treeModel.getFocusedNode()) {
			this.activitiesTree.treeModel.getFocusedNode().toggleActivated();
		}

		this.focusOrAssociationMode = true;
		this.associationModeIds = specificNodes;

		this.conditionalFocus(this.model);
		this.refreshTree();
	}

	private conditionalFocus(model: TreeNode[]) {
		for (const n of model) {
			const thisNode = this.associationModeIds.find(s => +s === n.id);
			if (thisNode) {
				n.visible = true;
			} else {
				n.visible = false;
			}

			if (n.children) {
				this.conditionalFocus(n.children);
			}
		}
	}

	public disableFocusOrAssociationMode() {
		this.focusOrAssociationMode = false;
		this.associationModeIds = undefined;
		this.makeNodesVisible(this.model);
	}

	private makeNodesVisible(nodes: TreeNode[]) {
		for (const n of nodes) {
			n.visible = true;
			if (n.children) {
				this.makeNodesVisible(n.children);
			}
		}
	}

	public onTreeLoad() {
		this.refreshTree();
	}

	public ngOnDestroy() {
		this.rootActivitiesSubscription.unsubscribe();
		this.refreshTreeSubscription.unsubscribe();
		this.focusedNodesSubscription.unsubscribe();
		this.clearFocusSubscription.unsubscribe();
	}

	public onClick(id: number) {
		this.selectedNodeId.emit(id);
	}

	public refreshTree() {
		this.sortNodesByName(this.model);
		this.activitiesTree.treeModel.update();
		setTimeout(() => {
			if (this.activitiesTree) {
				this.activitiesTree.sizeChanged();
			}
		}, 0);
	}
}
