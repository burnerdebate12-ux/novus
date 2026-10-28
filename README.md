Novus (Avatar Forge)

A browser-based 3D avatar designer. Build a stylized character, reshape it with sliders, change materials, preview animations, and export the result as a 3D file or as ready-to-use React Three Fiber code. The app's page title is Avatar Forge: 3D Avatar Designer.

Created with v0 and built on Next.js.

Features
Live 3D viewport with orbit camera, grid, and transform gizmo.
Parts and layers: base mesh (torso, head, eyes, arms, legs), armor, and accessories (glasses, pauldrons, cape). Each part can be shown, hidden or locked.
Morph panel: sliders for face roundness, face thinness, eye size, muscle and height, plus presets: Default, Heroic, Lean and Chibi.
Material panel: color, metalness, roughness, clearcoat and emissive glow for each part.
Transform panel: position, rotation and scale for the selected part.
Animation timeline: Idle, Walk, Run, Dance and Jump presets with play and pause.
Shading modes: lit, shaded, wireframe and x-ray.
Undo and redo for every edit.
Export: GLB, glTF, OBJ and JSON, plus generated React Three Fiber code for your design.
Publish dialog with Public, Team and Private visibility. Publishing is a UI demo only: it shows a success message but does not upload anywhere yet.
Keyboard shortcuts
Key	Action
W / E / R	Move, rotate, scale gizmo
Q	Toggle gizmo
G	Toggle grid
F	Reset camera
1 / 2 / 3 / 4	Lit, shaded, wireframe, x-ray
Space	Play or pause animation
Ctrl/Cmd + Z	Undo
Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y	Redo
Tech stack
Next.js 16 (App Router), React 19, TypeScript
three.js, React Three Fiber and drei
Tailwind CSS 4, shadcn/ui, Base UI, lucide-react, sonner
Vercel Analytics
Getting started

You need Node.js and pnpm.

sh
pnpm install
pnpm dev

Open http://localhost:3000.

Other scripts: pnpm build creates a production build and pnpm start serves it.

No environment variables are required.

Project structure
app/                        Next.js entry (layout, global styles, page)
components/
  avatar/                   Designer UI: navbar, sidebars, viewport, timeline, publish dialog
    panels/                 Morph, material, transform and export panels
    scene/                  3D scene and the character model
  ui/                       shadcn/ui primitives
lib/avatar/
  store.tsx                 Editor state with undo/redo
  defaults.ts, types.ts     Default design and shared types
  animations.ts             Animation presets
  exporters.ts              GLB, glTF, OBJ and JSON export
  code-gen.ts               React Three Fiber code generator
Roadmap ideas
Real publishing to an asset hub (storage and accounts)
More body parts, hair and outfit options
Importing existing GLB models
