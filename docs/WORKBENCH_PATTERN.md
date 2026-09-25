# Component workbench pattern

Button is the first trial. Review its interaction and visual treatment before applying this pattern to another component.

1. **One specimen, one model.** The live component, X-ray scene, graphical controls, contextual controls, and precise values read the same DialKit controller. Reset restores its defaults. Do not keep a second model inside the inspector.
2. **Tune by manipulating the object.** Draw controls from the component's physical rules: drag the Button's edge for height, side for padding, corner for radius, sun for light, and raised cap for lift. Show the resulting value beside the object. Generic sliders belong behind “Precise values and presets” or in a selected X-ray explanation.
3. **Keep cause visible.** Edits update the live specimen and X-ray immediately. A selected X-ray part explains the rule and lets the reader inspect individual material layers.
4. **Use the component system.** Miniatures read generated material recipes and colorway tokens. The workbench uses the site's surface, well, shadow, type, focus, and reduced-motion rules. Do not copy recipe values into page CSS.
5. **Give every manipulation an exact path.** Drag handles expose keyboard arrows and numeric values. Native inputs handle text, choices, and boolean states. Pointer capture ends on release or cancel.
6. **Verify the whole feature slice.** Check a real page in bone and graphite, desktop and narrow layouts, reduced motion, keyboard and pointer input, reset, and the handoff from preview to X-ray. Keep tests at integration or end-to-end level.

Button's page-scoped implementation lives in `apps/docs/src/pages/components/ButtonSmartControls.tsx` and `button-workbench.css`. DialKit remains the state and preset engine. Its inline panel is an optional precision view, not the primary interface.
