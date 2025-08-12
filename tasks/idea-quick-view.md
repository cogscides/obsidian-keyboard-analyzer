Idea is in addition to the existing keyboard plugin view, providing a more streamlined and quick access to keyboard shortcuts and commands. The view could be close to MySnippets pluhin's pop-up. There is also a command to open this popup view.

We need to think what features could such a quick preview have. E.g.:

- Display a list of all keyboard shortcuts and commands
- Allow users to filter commands by group or plugin
- Provide a search bar for quick access to specific commands
- Have a key listener (or only modifiers) to display the corresponding commands [This looks most important]

Configurations:

- max height of the preview container (for long lists of commands)

Idea: on single run open the preview, on double run start listening for key combinations and display the corresponding commands.
