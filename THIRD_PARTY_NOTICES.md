# Third-party notices

The browser floor-layout editor uses original Cabane code informed by
the following MIT-licensed projects:

## OpenPlan3D

- Project: <https://github.com/laanlabs/openPlan3D>
- License: MIT
- Referenced concepts: splitting wall graphs at T-junctions and traversing
  directed planar edges to discover bounded room faces.

Copyright remains with the OpenPlan3D contributors. The repository's source
was reviewed as a behavioral and algorithmic reference; its Svelte stores,
rendering layer, application state, and data schema were not copied.

## ai_room_planner

- Project: <https://github.com/countzero/ai_room_planner>
- License: MIT
- Referenced concepts: browser pointer interactions, left-hand planar room
  traversal, room metadata, and local draft persistence.

Copyright remains with the ai_room_planner contributors. The repository's
global-script UI, storage schema, and rendering implementation were not
copied.

## React Three Drei RoundedBox

The cached rounded-box primitive preserves the shape construction from
`@react-three/drei`'s RoundedBox.

MIT License

Copyright (c) 2020 react-spring

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
