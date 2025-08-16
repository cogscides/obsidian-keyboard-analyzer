// src/Constants.ts

import type { KeyboardLayout } from "./interfaces/Interfaces";

export const VIEW_TYPE_SHORTCUTS_ANALYZER = "keyboard-shortcuts-visualization";

// Unified Keyboard Layout Object
export const UNIFIED_KEYBOARD_LAYOUT: KeyboardLayout = {
	sections: [
		{
			name: "main",
			gridRatio: 3.75,
			rows: [
				[
					{ type: "common", label: "Escape", code: "Escape", unicode: "⎋" },
					{ type: "empty", width: 0.5 },
					{ type: "common", label: "F1", code: "F1" },
					{ type: "common", label: "F2", code: "F2" },
					{ type: "common", label: "F3", code: "F3" },
					{ type: "common", label: "F4", code: "F4" },
					{ type: "empty", width: 0.75 },
					{ type: "common", label: "F5", code: "F5" },
					{ type: "common", label: "F6", code: "F6" },
					{ type: "common", label: "F7", code: "F7" },
					{ type: "empty", width: 0.75 },
					{ type: "common", label: "F8", code: "F8" },
					{ type: "common", label: "F9", code: "F9" },
					{ type: "common", label: "F10", code: "F10" },
					{ type: "common", label: "F11", code: "F11" },
					{ type: "common", label: "F12", code: "F12" },
				],
				[
					{ type: "common", label: "`", code: "Backquote" },
					{ type: "common", label: "1", code: "Digit1" },
					{ type: "common", label: "2", code: "Digit2" },
					{ type: "common", label: "3", code: "Digit3" },
					{ type: "common", label: "4", code: "Digit4" },
					{ type: "common", label: "5", code: "Digit5" },
					{ type: "common", label: "6", code: "Digit6" },
					{ type: "common", label: "7", code: "Digit7" },
					{ type: "common", label: "8", code: "Digit8" },
					{ type: "common", label: "9", code: "Digit9" },
					{ type: "common", label: "0", code: "Digit0" },
					{ type: "common", label: "-", code: "Minus" },
					{ type: "common", label: "=", code: "Equal" },
					{
						type: "common",
						label: "Backspace",
						code: "Backspace",
						width: 2,
						unicode: "⌫",
					},
				],
				[
					{ type: "common", label: "Tab", code: "Tab", width: 1.5 },
					{ type: "common", label: "Q", code: "KeyQ" },
					{ type: "common", label: "W", code: "KeyW" },
					{ type: "common", label: "E", code: "KeyE" },
					{ type: "common", label: "R", code: "KeyR" },
					{ type: "common", label: "T", code: "KeyT" },
					{ type: "common", label: "Y", code: "KeyY" },
					{ type: "common", label: "U", code: "KeyU" },
					{ type: "common", label: "I", code: "KeyI" },
					{ type: "common", label: "O", code: "KeyO" },
					{ type: "common", label: "P", code: "KeyP" },
					{ type: "common", label: "[", code: "BracketLeft" },
					{ type: "common", label: "]", code: "BracketRight" },
					{ type: "common", label: "\\", code: "Backslash", width: 1.5 },
				],
				[
					{
						type: "common",
						label: "Caps",
						code: "CapsLock",
						width: 1.75,
						unicode: "⇪",
					},
					{ type: "common", label: "A", code: "KeyA" },
					{ type: "common", label: "S", code: "KeyS" },
					{ type: "common", label: "D", code: "KeyD" },
					{ type: "common", label: "F", code: "KeyF" },
					{ type: "common", label: "G", code: "KeyG" },
					{ type: "common", label: "H", code: "KeyH" },
					{ type: "common", label: "J", code: "KeyJ" },
					{ type: "common", label: "K", code: "KeyK" },
					{ type: "common", label: "L", code: "KeyL" },
					{ type: "common", label: ";", code: "Semicolon" },
					{ type: "common", label: "'", code: "Quote" },
					{ type: "common", label: "Enter", code: "Enter", width: 2.25 },
				],
				[
					{
						type: "common",
						label: "Shift",
						code: "ShiftLeft",
						width: 2.25,
						unicode: "⇧",
					},
					{ type: "common", label: "Z", code: "KeyZ" },
					{ type: "common", label: "X", code: "KeyX" },
					{ type: "common", label: "C", code: "KeyC" },
					{ type: "common", label: "V", code: "KeyV" },
					{ type: "common", label: "B", code: "KeyB" },
					{ type: "common", label: "N", code: "KeyN" },
					{ type: "common", label: "M", code: "KeyM" },
					{ type: "common", label: ",", code: "Comma" },
					{ type: "common", label: ".", code: "Period" },
					{ type: "common", label: "/", code: "Slash" },
					{
						type: "common",
						label: "Shift",
						code: "ShiftRight",
						width: 2.75,
						unicode: "⇧",
					},
				],
				[
					{
						type: "os-specific",
						width: 1.5,
						os: {
							macos: {
								label: "Control",
								code: "ControlLeft",
								unicode: "⌃",
								modifier: "Control",
							},
							windows: {
								label: "Ctrl",
								code: "ControlLeft",
								unicode: "Ctrl",
								modifier: "Control",
							},
							linux: {
								label: "Ctrl",
								code: "ControlLeft",
								unicode: "Ctrl",
								modifier: "Control",
							},
						},
					},
					{
						type: "os-specific",
						width: 1.5,
						os: {
							macos: {
								label: "Alt",
								code: "AltLeft",
								unicode: "⌥",
								modifier: "Alt",
							},
							windows: {
								label: "Win",
								code: "MetaLeft",
								unicode: "Win",
								modifier: undefined,
							},
							linux: {
								label: "Win",
								code: "MetaLeft",
								unicode: "Super",
								modifier: undefined,
							},
						},
					},
					{
						type: "os-specific",
						width: 1.5,
						os: {
							macos: {
								label: "Meta",
								code: "MetaLeft",
								unicode: "⌘",
								modifier: "Meta",
							},
							windows: {
								label: "Alt",
								code: "AltLeft",
								unicode: "Alt",
								modifier: "Alt",
							},
							linux: {
								label: "Alt",
								code: "AltLeft",
								unicode: "Alt",
								modifier: "Alt",
							},
						},
					},
					{ type: "common", label: " ", code: "Space", unicode: "⎵", width: 6 },
					{
						type: "os-specific",
						width: 1.5,
						os: {
							macos: {
								label: "Meta",
								code: "MetaRight",
								unicode: "⌘",
								modifier: "Meta",
							},
							windows: {
								label: "Alt",
								code: "AltRight",
								unicode: "Alt",
								modifier: "Alt",
							},
							linux: {
								label: "Alt",
								code: "AltRight",
								unicode: "Alt",
								modifier: "Alt",
							},
						},
					},
					{
						type: "os-specific",
						width: 1.5,
						os: {
							macos: {
								label: "Alt",
								code: "AltRight",
								unicode: "⌥",
								modifier: "Alt",
							},
							windows: {
								label: "Win",
								code: "MetaRight",
								unicode: "Win",
								modifier: undefined,
							},
							linux: {
								label: "Win",
								code: "MetaRight",
								unicode: "Super",
								modifier: undefined,
							},
						},
					},
					{
						type: "os-specific",
						width: 1.5,
						os: {
							macos: {
								label: "Control",
								code: "ControlRight",
								unicode: "⌃",
								modifier: "Control",
							},
							windows: {
								label: "Ctrl",
								code: "ControlRight",
								unicode: "Ctrl",
								modifier: "Control",
							},
							linux: {
								label: "Ctrl",
								code: "ControlRight",
								unicode: "Ctrl",
								modifier: "Control",
							},
						},
					},
				],
			],
		},
		{
			name: "other",
			gridRatio: 0.75,
			rows: [
				[{ type: "empty" }, { type: "empty" }, { type: "empty" }],
				[
					{ type: "common", label: "Insert", code: "Insert", smallText: true },
					{ type: "common", label: "Home", code: "Home", smallText: true },
					{ type: "common", label: "PgUp", code: "PageUp", smallText: true },
				],
				[
					{ type: "common", label: "Delete", code: "Delete", smallText: true },
					{ type: "common", label: "End", code: "End", smallText: true },
					{
						type: "common",
						label: "PgUp",
						code: "PageDown",
						smallText: true,
					},
				],
				[{ type: "empty" }, { type: "empty" }, { type: "empty" }],
				[
					{ type: "empty" },
					{ type: "common", label: "ArrowUp", code: "ArrowUp", unicode: "↑" },
					{ type: "empty" },
				],
				[
					{
						type: "common",
						label: "ArrowLeft",
						code: "ArrowLeft",
						unicode: "←",
					},
					{
						type: "common",
						label: "ArrowDown",
						code: "ArrowDown",
						unicode: "↓",
					},
					{
						type: "common",
						label: "ArrowRight",
						code: "ArrowRight",
						unicode: "→",
					},
				],
			],
		},
		{
			name: "num",
			gridRatio: 1,
			rows: [
				[
					{ type: "empty" },
					{ type: "empty" },
					{ type: "empty" },
					{ type: "empty" },
				],
				[
					{ type: "common", label: "NumLock", code: "NumLock", unicode: "⇭" },
					{ type: "common", label: "/", code: "NumpadDivide" },
					{ type: "common", label: "*", code: "NumpadMultiply", unicode: "×" },
					{ type: "common", label: "-", code: "NumpadSubtract" },
				],
				[
					{ type: "common", label: "7", code: "Numpad7" },
					{ type: "common", label: "8", code: "Numpad8" },
					{ type: "common", label: "9", code: "Numpad9" },
					{ type: "common", label: "+", code: "NumpadAdd", height: 2 },
				],
				[
					{ type: "common", label: "4", code: "Numpad4" },
					{ type: "common", label: "5", code: "Numpad5" },
					{ type: "common", label: "6", code: "Numpad6" },
				],
				[
					{ type: "common", label: "1", code: "Numpad1" },
					{ type: "common", label: "2", code: "Numpad2" },
					{ type: "common", label: "3", code: "Numpad3" },
					{ type: "common", label: "Enter", code: "Enter", height: 2 },
				],
				[
					{ type: "common", label: "0", code: "Numpad0", width: 2 },
					{ type: "common", label: ".", code: "NumpadDecimal" },
				],
			],
		},
	],
};
