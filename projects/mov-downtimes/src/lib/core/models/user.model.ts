export interface User {
	id: number;
	username: string;
	superAdmin: boolean;
	admin?: boolean;
	name?: string;
}
