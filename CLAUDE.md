# CLAUDE.md

## Tech Stack
- Plain HTML, CSS, and JavaScript only.
- No frameworks, no build step. Files should open directly in a browser.

## Project Structure
- `index.html` – portal homepage with the grid of tool cards
- `css/style.css` – shared styles and the light/dark theme colors
- `js/theme.js` – light/dark theme toggle, used by every page
- `tools/<tool-name>/` – one folder per tool, each with its own `index.html` and `.js` file
  - `tools/entity-generator/` – Entity Generator (phase 1)
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
**Phase 1 – Portal + Entity Generator** ✅
- ✅ Done: homepage, shared header, light/dark toggle, responsive layout.
- ✅ Done: Entity Generator (replaced the "Tool 1" placeholder). Student enters an entity name, architecture name and ports (name, mode, type, width) and gets ready-to-copy VHDL: libraries, entity, empty architecture.
  - Types: `std_logic`, `std_logic_vector`, `unsigned`, `signed`; width 8 gives `(7 downto 0)`. No generics yet.
- ✅ Done: output has short explanatory comments, the form has tips, and invalid names/widths get plain-language errors.
- ✅ Done: Copy and Download .vhd buttons.

**Phase 2 – More tools** (one at a time, ideas to confirm)
- Testbench generator, truth table → VHDL, vector/number converter.

**Phase 3 – Polish** (ideas to confirm)
- Improvements based on student feedback.

## Rules for Claude
- Explain technical terms in plain language.
- Ask before making big changes.
- Ask rather than guess when something is unclear.
