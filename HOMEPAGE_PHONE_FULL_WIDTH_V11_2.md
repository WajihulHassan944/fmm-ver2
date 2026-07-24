# Phone Homepage Full-Width Fix (v11.2)

- Removed the height-derived stage-width constraint that centered a narrow 670:1595 canvas and produced black gutters on wider phone viewports.
- The single-screen phone homepage now uses the complete dynamic viewport width and height.
- Reset `html`, `body`, `#__next`, and the homepage wrappers to full width with no margin, padding, or max-width constraints.
- Preserved the existing one-screen artwork, hotspot alignment, animations, routes, prerender fix, and desktop homepage behavior.
