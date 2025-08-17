import { PluginSettingTab, Setting } from "obsidian";
import type KeyboardAnalyzerPlugin from "./main";
import { setDevLoggingEnabled, setEmulatedOS } from "./utils/runtimeConfig";

export default class KeyboardAnalyzerSettingTab extends PluginSettingTab {
	plugin: KeyboardAnalyzerPlugin;

	constructor(plugin: KeyboardAnalyzerPlugin) {
		super(plugin.app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl("h2", { text: "Keyboard Analyzer" });

		// Developer options gate
		new Setting(containerEl)
			.setName("Enable developer options")
			.setDesc("Show extra developer tools in the UI and settings.")
			.addToggle((toggle) => {
				toggle.setValue(
					!!this.plugin.settingsManager.getSetting("enableDeveloperOptions"),
				);
				toggle.onChange((value) => {
					this.plugin.settingsManager.updateSettings({
						enableDeveloperOptions: value,
					});
					// No runtime effect needed besides re-render on Svelte side
				});
			});

		// Dev logging
		new Setting(containerEl)
			.setName("Developer logging")
			.setDesc("Enable verbose logging to the console for diagnostics.")
			.addToggle((toggle) => {
				toggle.setValue(
					!!this.plugin.settingsManager.getSetting("devLoggingEnabled"),
				);
				toggle.onChange((value) => {
					this.plugin.settingsManager.updateSettings({
						devLoggingEnabled: value,
					});
					setDevLoggingEnabled(value);
				});
			});

		// Emulated OS
		new Setting(containerEl)
			.setName("Emulated OS")
			.setDesc("Temporarily override OS to test modifier mapping.")
			.addDropdown((dropdown) => {
				dropdown.addOption("none", "None");
				dropdown.addOption("windows", "Windows");
				dropdown.addOption("macos", "macOS");
				dropdown.addOption("linux", "Linux");
				dropdown.setValue(
					(this.plugin.settingsManager.getSetting("emulatedOS") || "none") as
						| "none"
						| "windows"
						| "macos"
						| "linux",
				);
				dropdown.onChange((value) => {
					const os = value as "none" | "windows" | "macos" | "linux";
					this.plugin.settingsManager.updateSettings({ emulatedOS: os });
					setEmulatedOS(os);
				});
			});

		// Baked key display names (dev-facing toggle)
		new Setting(containerEl)
			.setName("Use baked key names")
			.setDesc(
				"Show human-friendly key names (e.g., Backspace, Up Arrow, Cmd). Turn off to debug raw keys/glyphs.",
			)
			.addToggle((toggle) => {
				toggle.setValue(
					!!this.plugin.settingsManager.getSetting("useBakedKeyNames"),
				);
				toggle.onChange((value) => {
					this.plugin.settingsManager.updateSettings({
						useBakedKeyNames: value,
					});
				});
			});

		// Key listener scope
		new Setting(containerEl)
			.setName("Key listener scope")
			.setDesc(
				"Restrict the active key listener to the Analyzer view, or allow it globally.",
			)
			.addDropdown((dropdown) => {
				dropdown.addOption("activeView", "Active view only");
				dropdown.addOption("global", "Global");
				dropdown.setValue(
					(this.plugin.settingsManager.getSetting("keyListenerScope") ||
						"activeView") as "activeView" | "global",
				);
				dropdown.onChange((value) => {
					this.plugin.settingsManager.updateSettings({
						keyListenerScope: (value as "activeView" | "global") || "activeView",
					});
				});
			});

		// Chord preview mode
		new Setting(containerEl)
			.setName("Chord preview mode")
			.setDesc(
				"While key listener is active: preview the pressed chord and clear on release.",
			)
			.addToggle((toggle) => {
				toggle.setValue(
					!!this.plugin.settingsManager.getSetting("chordPreviewMode"),
				);
				toggle.onChange((value) => {
					this.plugin.settingsManager.updateSettings({
						chordPreviewMode: value,
					});
				});
			});

		// Search debounce
		new Setting(containerEl)
			.setName("Search debounce (ms)")
			.setDesc("Delay before applying text filter changes.")
			.addText((text) => {
				text.inputEl.type = "number";
				text.setPlaceholder("200");
				text.setValue(String(this.plugin.settingsManager.getSetting("searchDebounceMs") ?? 200));
				text.onChange((value) => {
					const ms = Number(value);
					this.plugin.settingsManager.updateSettings({
						searchDebounceMs: Number.isFinite(ms) ? ms : 200,
					});
				});
			});
	}
}
