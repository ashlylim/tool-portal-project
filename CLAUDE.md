# CLAUDE.md

## Tech Stack
- Plain HTML, CSS, and JavaScript only.
- No frameworks, no build step. Files should open directly in a browser.

## Project Structure
The repo is nearly empty for now:
- `README.md` – project readme
- `CLAUDE.md` – this file

Update this section as files and folders are added.

## Key Requirements
1. Every page must be responsive and work on desktop, tablet, and phone.
2. Users can toggle between a light and a dark theme. The default is the light theme.
3. Text must stay easy to read, with good contrast, in both the light and the dark theme.

## Feature Plan
A web portal where students try small VHDL tools in the browser.

### Portal structure
- **Homepage** (`index.html`): short intro plus a grid of tool cards (name + one-line description).
- **Opening a tool:** clicking a card opens that tool's own page.
- **Getting back:** every page has the same header. The portal name links to the homepage, and tool pages also show a "← All tools" link.
- **Adding a tool later:** create a folder `tools/<tool-name>/` with its own `index.html` and `.js` file, then add one card to the homepage. Shared look and the theme toggle come from `css/style.css` and `js/theme.js`.

### Phases
**Phase 1 – Portal + Entity Generator**
- Homepage, shared header, light/dark toggle, responsive layout.
- Entity Generator: student enters an entity name and ports (name, in/out, type, width) and gets ready-to-copy VHDL: libraries, entity, empty architecture.
- Output has short explanatory comments, the form has tips, and invalid names get plain-language errors.
- Copy and Download .vhd buttons.

**Phase 2 – More tools** (one at a time, ideas to confirm)
- Testbench generator, truth table → VHDL, vector/number converter.

**Phase 3 – Polish** (ideas to confirm)
- Improvements based on student feedback.

## Rules for Claude
- Explain technical terms in plain language.
- Ask before making big changes.
- Ask rather than guess when something is unclear.
