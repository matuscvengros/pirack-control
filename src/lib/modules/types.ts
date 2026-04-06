export interface ModuleConfig {
	[key: string]: unknown;
}

export interface ModuleData {
	[key: string]: unknown;
}

export interface ActionResult {
	success: boolean;
	data?: unknown;
	error?: string;
}

export interface ModuleMeta {
	id: string;
	name: string;
	icon: string;
	expandable: boolean;
	defaultConfig: ModuleConfig;
}

export interface ModuleDefinition extends ModuleMeta {
	getData(config: ModuleConfig): Promise<ModuleData>;
	onAction?(action: string, payload: unknown, config: ModuleConfig): Promise<ActionResult>;
}

export interface AppConfig {
	general: {
		rackName: string;
		rackSubtitle: string;
		lcdAutoReturnSeconds: number;
	};
	modules: {
		order: string[];
		enabled: string[];
		settings: Record<string, ModuleConfig>;
	};
}
