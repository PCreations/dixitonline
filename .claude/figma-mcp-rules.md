## Figma MCP Integration Rules
These rules define how to translate Figma inputs into code for this project and must be followed for every Figma-driven change.

### Required flow (do not skip)
1. Run get_design_context first to fetch the structured representation for the exact node(s).
2. If the response is too large or truncated, run get_metadata to get the high‑level node map and then re‑fetch only the required node(s) with get_design_context.
3. Run get_screenshot for a visual reference of the node variant being implemented.
4. Only after you have both get_design_context and get_screenshot, download any assets needed and start implementation.
5. Translate the output (usually React + Tailwind) into this project's conventions, styles and framework.  Reuse the project's color tokens, components, and typography wherever possible.
6. Validate against Figma for 1:1 look and behavior before marking complete.

### Implementation rules
- Treat the Figma MCP output (React + Tailwind) as a representation of design and behavior, not as final code style.
- Replace Tailwind utility classes with the project's preferred utilities/design‑system tokens when applicable.
- Reuse existing components (e.g., buttons, inputs, typography, icon wrappers) instead of duplicating functionality.
- Use the project's color system, typography scale, and spacing tokens consistently.
- Respect existing routing, state management, and data‑fetch patterns already adopted in the repo.
- Strive for 1:1 visual parity with the Figma design. When conflicts arise, prefer design‑system tokens and adjust spacing or sizes minimally to match visuals.
- Validate the final UI against the Figma screenshot for both look and behavior.

### Figma MCP server rules
- The Figma MCP server provides an assets endpoint which can serve image and SVG assets
- IMPORTANT: If the Figma MCP server returns a localhost source for an image or an SVG, use that image or SVG source directly
- IMPORTANT: DO NOT import/add new icon packages, all the assets should be in the Figma payload
- IMPORTANT: do NOT use or create placeholders if a localhost source is provided