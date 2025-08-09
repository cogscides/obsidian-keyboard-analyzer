---
- Status: todo
---

## Context
We see the next bugs and issues that needs to be fixed:
- Key listener button in the search bar looks oval in some Obsidian theme. It need to be fixed to look as other buttons, at least to the clean-up that next to it.

Features to create:
- Add a wrap plugin name command that would turn on and off wrapping plugin name in a button look in commands list. At the moment it useful to display them as buttons, but it takes too much real estate and might be useful to not do this for some users' use cases. Please ensure we think through all the states and conflicts with other settigns (e.g. how it works with group by plugin, highlight built-in modules, how it affect cutting the plugin name from the command title if view feature disabled/enabled)
- create and explore new feature to give users control over the visual keyboard. At the moment its being affected by active filter/search. I assume it might create compilcation for users who are exploring the options to change their keybindings. Thinking so I'm wondering about making a toggle to take into account filter/search or display all hotkeys (heatmaps). Active keys still should be displayed correctly. Please think deeply about this feature.
- Additional feature for the visual keyboard appearance:
  - We need to have a feature to open/close the visual keyboard. It should be compact and ux friendly, nice place would be at the top left of the visual keyboard.
  - we need to fix donate button placement, it looks positioned absolute and overflows the keys sometimes.