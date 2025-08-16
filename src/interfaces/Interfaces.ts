// src/interfaces/Interfaces.ts
import type { Command, Hotkey, Modifier, App, KeymapInfo } from "obsidian";

export interface commandEntry {
	id: string;
	name: string;
	hotkeys: hotkeyEntry[];
	defaultHotkeys: hotkeyEntry[];
	customHotkeys: hotkeyEntry[];
	isInternalModule: boolean;
	pluginName: string;
	cmdName: string;
}

export type commandsArray = commandEntry[];

// Plugin Data
export interface hotkeyEntry extends Hotkey {
	isCustom: boolean;
	backedModifiers?: string;
}

export interface hotkeyDict {
	[id: string]: commandEntry;
}

export interface KeyOSDefinition {
	label: string;
	code: string;
	unicode?: string;
	modifier?: "Control" | "Alt" | "Shift" | "Meta";
}

export interface Key {
	type: "common" | "os-specific" | "empty";
	label?: string;
	code?: string;
	unicode?: string;
	win_unicode?: string;
	mac_unicode?: string;
	width?: number;
	height?: number;
	smallText?: boolean;
	logicalModifier?: "Control" | "Alt" | "Shift" | "Meta";
	os?: {
		macos: KeyOSDefinition;
		windows: KeyOSDefinition;
		linux: KeyOSDefinition;
	};
}

export interface KeyboardSection {
	name: string;
	gridRatio: number;
	rows: Key[][];
}

export interface KeyboardLayout {
	sections: KeyboardSection[];
}

export interface KeyboardKeyState {
	displayValue: string; // This replaces 'output'
	code: string; // This replaces 'keyCode'
	state: "active" | "inactive" | "hover" | "possible" | "disabled" | "empty";
	weight?: number;
	smallText?: boolean;
}

export interface UnsafeHotkeyManager {
	getHotkeys(id: string): KeymapInfo[];
	getDefaultHotkeys(id: string): KeymapInfo[];
	customKeys: Record<string, KeymapInfo[]>;
}

// Unsafe Interfaces

/*
 * Commands Interface to be used in the commandsManager
 */
export interface UnsafeCommands {
	app: App;
	commands: Record<string, Command>;
	editorCommands: Record<string, Command>;
	addCommand(command: Command): void;
	executeCommand(command: Command): boolean;
	listCommands(): Command[];
	findCommand(id: string): Command;
	removeCommand(id: string): void;
	executeCommandById(id: string): boolean;
}

export interface UnsafeInternalPluginInstance {
	id: string;
	name: string;
	commands?: Record<string, Command>;
}

export interface UnsafeInternalPlugin {
	manifest?: { id?: string; name?: string };
	instance: UnsafeInternalPluginInstance;
}

// Helper type to convert KeymapInfo to Hotkey
export type KeymapInfoToHotkey = KeymapInfo & {
	modifiers: Modifier[] | string;
	key: string;
};

// Helper function to convert KeymapInfo to Hotkey
export function convertKeymapInfoToHotkey(keymapInfo: KeymapInfo): Hotkey {
	return {
		modifiers: (keymapInfo.modifiers || "").split(",") as Modifier[],
		key: keymapInfo.key !== null ? keymapInfo.key : "",
	};
}
