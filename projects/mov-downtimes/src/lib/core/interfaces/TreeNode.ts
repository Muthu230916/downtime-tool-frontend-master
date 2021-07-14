export interface TreeNode {
	id: number;
	name: string;
	hasChildren: boolean;
	children?: TreeNode[];
	isActive: boolean;
	color?: string;
	icon?: string;
	visible: boolean;
}
