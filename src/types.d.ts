declare namespace App {
	interface Locals {
		locale?: string;
		theme?: 'light' | 'dark';
		user?: {
			id: string;
			email?: string;
			name?: string;
		};
	}
}
