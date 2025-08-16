import type { App, KeymapInfo, Hotkey, Modifier, Command } from "obsidian";
import type {
	hotkeyEntry,
	commandEntry,
	UnsafeInternalPlugin,
} from "../../interfaces/Interfaces";
import {
	convertModifiers,
	sortModifiers,
	modifiersToString,
	areModifiersEqual,
	isKeyMatch,
	platformizeModifiers,
} from "../../utils/modifierUtils";

export default class HotkeyManager {
	private static instance: HotkeyManager | null = null;
	private app: App;
	private commands: Record<string, commandEntry> = {};

	private constructor(app: App) {
		this.app = app;
	}

	static getInstance(app: App): HotkeyManager {
		if (!HotkeyManager.instance) {
			HotkeyManager.instance = new HotkeyManager(app);
		}
		return HotkeyManager.instance;
	}

	public async initialize() {
		this.commands = await this.getAllHotkeys();
	}

	private async getAllHotkeys(): Promise<Record<string, commandEntry>> {
		const commands = this.getCommands();
		return this.processCommands(commands);
	}

	private getCommands(): Command[] {
		const commands = this.app.commands.commands;
		return Object.values(commands);
	}

	private processCommands(commands: Command[]): Record<string, commandEntry> {
		return commands.reduce(
			(acc, command) => {
				const hotkeys = this.getHotkeysForCommand(command.id);
				const [pluginId, cmdName] = command.id.split(":");
				acc[command.id] = {
					id: command.id,
					name: command.name,
					hotkeys: hotkeys.all,
					defaultHotkeys: hotkeys.default,
					customHotkeys: hotkeys.custom,
					isInternalModule: this.isInternalModule(command.id), // Add this line
					pluginName: this.getPluginName(pluginId),
					cmdName: cmdName || command.name,
				};
				return acc;
			},
			{} as Record<string, commandEntry>,
		);
	}

	private isInternalModule(commandId: string): boolean {
		const pluginId = (commandId || "").split(":")[0] || "";
		const internalModules = [
			"audio-recorder",
			"backlink",
			"bookmarks",
			"canvas",
			"command-palette",
			"daily-notes",
			"editor-status",
			"file-explorer",
			"file-recovery",
			"global-search",
			"graph",
			"markdown-importer",
			"note-composer",
			"outgoing-link",
			"outline",
			"page-preview",
			"properties",
			"publish",
			"random-note",
			"slash-command",
			"slides",
			"starred",
			"switcher",
			"sync",
			"tag-pane",
			"templates",
			"word-count",
			"workspaces",
			"zk-prefixer",
		];
		const coreNamespaces = [
			"app",
			"editor",
			"markdown",
			"open-with-default-app",
			"theme",
			"window",
			"workspace",
		];
		if (internalModules.includes(pluginId)) return true;
		if (coreNamespaces.includes(pluginId)) return true;
		// Heuristic fallback: not a community plugin => internal
		const isCommunity = Boolean(this.app.plugins.plugins[pluginId]);
		if (isCommunity) return false;
		const enabledInternal = this.app.internalPlugins.getEnabledPlugins();
		const isInternal = enabledInternal.some((p) => p.instance.id === pluginId);
		return isInternal || !isCommunity;
	}

	private getPluginName(pluginId: string): string {
		const plugin = this.app.plugins.plugins[pluginId];
		if (plugin) return plugin.manifest.name;

		const internalPlugins = this.app.internalPlugins.getEnabledPlugins();

		const internalPlugin = internalPlugins.find(
			(plugin) => plugin.instance.id === pluginId,
		) as UnsafeInternalPlugin | undefined;

		if (internalPlugin?.instance) {
			return internalPlugin.instance.name || pluginId;
		}

		return pluginId;
	}

	public getHotkeysForCommand(id: string): {
		all: hotkeyEntry[];
		default: hotkeyEntry[];
		custom: hotkeyEntry[];
	} {
		const defaultHotkeys = this.app.hotkeyManager.getDefaultHotkeys(id) || [];
		const customHotkeys = this.app.hotkeyManager.customKeys[id] || [];

		const processHotkeys = (
			hotkeys: KeymapInfo[],
			isCustom: boolean,
		): hotkeyEntry[] => {
			return hotkeys.map(
				(hotkey): hotkeyEntry => ({
					modifiers: Array.isArray(hotkey.modifiers)
						? hotkey.modifiers
						: typeof hotkey.modifiers === "string"
							? (hotkey.modifiers.split(",") as Modifier[])
							: [],
					key: hotkey.key || "",
					isCustom: isCustom,
				}),
			);
		};

		const defaultEntries = processHotkeys(defaultHotkeys, false);
		const customEntries = processHotkeys(customHotkeys, true);

		// Create a map to store unique hotkeys
		const hotkeyMap = new Map<string, hotkeyEntry>();

		// Add default hotkeys to the map
		defaultEntries.forEach((entry) => {
			const key = this.hotkeyToUniqueKey(entry);
			hotkeyMap.set(key, entry);
		});

		// Add or override with custom hotkeys
		customEntries.forEach((entry) => {
			const key = this.hotkeyToUniqueKey(entry);
			hotkeyMap.set(key, entry);
		});

		// Convert the map back to an array
		const allHotkeys = Array.from(hotkeyMap.values());

		return {
			all: allHotkeys,
			default: defaultEntries,
			custom: customEntries,
		};
	}

	private hotkeyToUniqueKey(hotkey: hotkeyEntry): string {
		const sortedModifiers = [...hotkey.modifiers].sort().join(",");
		return `${sortedModifiers}|${hotkey.key}`;
	}

	public getAllHotkeysForCommand(id: string): hotkeyEntry[] {
		const { all } = this.getHotkeysForCommand(id);
		return all;
	}

	public isHotkeyDuplicate(id: string, hotkey: Hotkey): boolean {
		return Object.values(this.commands).some(
			(command) =>
				command.id !== id &&
				command.hotkeys.some(
					(existingHotkey) =>
						areModifiersEqual(existingHotkey.modifiers, hotkey.modifiers) &&
						existingHotkey.key === hotkey.key,
				),
		);
	}

	public commandMatchesHotkey(
		id: string,
		activeModifiers: Modifier[],
		activeKey: string,
	): boolean {
		const { all: hotkeys } = this.getHotkeysForCommand(id);
		return hotkeys.some((hotkey) =>
			this.hotkeyMatches(hotkey, activeModifiers, activeKey),
		);
	}

	private hotkeyMatches(
		hotkey: hotkeyEntry,
		activeModifiers: Modifier[],
		activeKey: string,
	): boolean {
		// Normalize both sides so 'Mod' matches 'Ctrl' on Windows/Linux and 'Meta' on macOS
		const normalizedActive = sortModifiers(
			platformizeModifiers(activeModifiers as unknown as string[]),
		);
		const normalizedHotkey = sortModifiers(
			platformizeModifiers(hotkey.modifiers as unknown as string[]),
		);
		const modifiersMatch = areModifiersEqual(
			normalizedActive,
			normalizedHotkey,
		);
		const keyMatch = !activeKey || isKeyMatch(activeKey, hotkey.key);
		return modifiersMatch && keyMatch;
	}

	public renderHotkey(hotkey: hotkeyEntry): string {
		// Ensure consistent display order across platforms
		const mods = sortModifiers(
			platformizeModifiers(hotkey.modifiers as unknown as string[]),
		);
		return [...mods, hotkey.key].join(" ");
	}

	public searchHotkeys(
		search: string,
		activeModifiers: Modifier[],
		activeKey: string,
	): commandEntry[] {
		return Object.values(this.commands).filter((command) => {
			const hotkeyMatch = this.commandMatchesHotkey(
				command.id,
				activeModifiers,
				activeKey,
			);
			const searchMatch =
				command.name.toLowerCase().includes(search.toLowerCase()) ||
				command.id.toLowerCase().includes(search.toLowerCase());
			return hotkeyMatch && searchMatch;
		});
	}
}
