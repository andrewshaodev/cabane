# Mediterranean wall art

Four additional low-fidelity French village landscapes are documented in
[LANDSCAPES.md](LANDSCAPES.md), with their variant IDs and exact generation prompts.

Five original illustrations generated with the built-in image_gen tool on 2026-10-24, one generation per image. No source photograph is bundled. These generated assets ship with the catalog under the repository license.

Files: olive-jug.png, lemons-bowl.png, fig-study.png, pottery-vases.png, rosemary-pitcher.png. Each is a landscape 1484 × 1060 PNG (7:5).

The `framed-wall-art` variants are `olive`, `lemons`, `figs`, `clay` (pottery), and `fern` (rosemary). The latter two IDs preserve existing saved placements. `default` retains the abstract relief. The public `FramedWallArt` component additionally accepts `imageUrl` for custom bundled or CORS-enabled image URLs; this is a component prop, not a new persisted project field. Never place credentials or household data in image URLs.

Prints use sRGB textures and white toon material, preserve the source aspect ratio even when the frame is resized independently on each axis, and fit within the cream mount without cropping. Each mounted print owns and disposes its texture. Loading is non-suspending; an unavailable image leaves the cream mount visible. The canvas front is Z=0.037 m and the image is at Z=0.04 m (3 mm clearance). The frame remains 80 × 60 × 4 cm, bottom Y=0, back Z=0, front +Z.

## Generation prompts

## 1. An abundant olive branch with large sage and olive leaves in a squat terracotta jug

Use case: illustration-story. Asset type: a standalone landscape 7:5 art print texture for a cozy 3D home's framed wall art. Subject: An abundant olive branch with large sage and olive leaves in a squat terracotta jug. Soft hand-painted gouache, charming simplified low-fi Mediterranean still life. Warm cream paper background, sage green, olive, muted terracotta and warm ochre palette. Large clear painted shapes filling most of the composition, legible from across a room; subtle brush texture, gentle shadows, calm cozy mood. Flat front-on illustration only, no perspective of paper, no frame, no border, no text, no watermark. Entire composition landscape 7:5.

## 2. Three ripe lemons beside a small cream ceramic bowl and one leafy twig

Use case: illustration-story. Asset type: a standalone landscape 7:5 art print texture for a cozy 3D home's framed wall art. Subject: Three ripe lemons beside a small cream ceramic bowl and one leafy twig. Soft hand-painted gouache, charming simplified low-fi Mediterranean still life. Warm cream paper background, sage green, olive, muted terracotta and warm ochre palette. Large clear painted shapes filling most of the composition, legible from across a room; subtle brush texture, gentle shadows, calm cozy mood. Flat front-on illustration only, no perspective of paper, no frame, no border, no text, no watermark. Entire composition landscape 7:5.

## 3. A broad fan of fig leaves and two purple figs in a low terracotta dish

Use case: illustration-story. Asset type: a standalone landscape 7:5 art print texture for a cozy 3D home's framed wall art. Subject: A broad fan of fig leaves and two purple figs in a low terracotta dish. Soft hand-painted gouache, charming simplified low-fi Mediterranean still life. Warm cream paper background, sage green, olive, muted terracotta and warm ochre palette. Large clear painted shapes filling most of the composition, legible from across a room; subtle brush texture, gentle shadows, calm cozy mood. Flat front-on illustration only, no perspective of paper, no frame, no border, no text, no watermark. Entire composition landscape 7:5.

## 4. Two softly rounded Mediterranean pottery vases with a single leafy eucalyptus branch

Use case: illustration-story. Asset type: a standalone landscape 7:5 art print texture for a cozy 3D home's framed wall art. Subject: Two softly rounded Mediterranean pottery vases with a single leafy eucalyptus branch. Soft hand-painted gouache, charming simplified low-fi Mediterranean still life. Warm cream paper background, sage green, olive, muted terracotta and warm ochre palette. Large clear painted shapes filling most of the composition, legible from across a room; subtle brush texture, gentle shadows, calm cozy mood. Flat front-on illustration only, no perspective of paper, no frame, no border, no text, no watermark. Entire composition landscape 7:5.

## 5. A potted rosemary bush beside a warm terracotta pitcher

Use case: illustration-story. Asset type: a standalone landscape 7:5 art print texture for a cozy 3D home's framed wall art. Subject: A potted rosemary bush beside a warm terracotta pitcher. Soft hand-painted gouache, charming simplified low-fi Mediterranean still life. Warm cream paper background, sage green, olive, muted terracotta and warm ochre palette. Large clear painted shapes filling most of the composition, legible from across a room; subtle brush texture, gentle shadows, calm cozy mood. Flat front-on illustration only, no perspective of paper, no frame, no border, no text, no watermark. Entire composition landscape 7:5.
