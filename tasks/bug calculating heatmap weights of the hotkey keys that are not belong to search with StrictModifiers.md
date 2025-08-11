---
created:
owner: "@you"
status:
  - todo
title:
---
Scenario:
- Enabled the `StrictModifiersSearch` option.
- We have a command `command_A` that have two shortcuts: `⌃ ⇧ Tab` and `⌘ ⇧ [`
- In search we looking for `⌘ ⇧`, in this case we display `command_A` in the list of commands, but we also calculating weights for `Tab` even tho selected search modifiers

Desired behavior:
- It's good that we are displaying `⌃ ⇧ Tab` in `command_A`, but we don't need to count `Tab` key heatmap, as in this case it may confuse users who are looking only for  `⌘ ⇧` key assignments
- 