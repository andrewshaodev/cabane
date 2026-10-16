import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { withModules } from "./test-server.mjs";

await withModules(async (load) => {
  const { paintWoodPlanks } = await load("/packages/engine/src/floor-finishes/wood-planks.ts");
  // Pixel fingerprints captured from the original per-pixel canvas renderer.
  const fingerprints = [
    "ef75a8bb9639cb57fa620b5f7e56823d65b50d18e92085bb275075dc85d380ae",
    "dd93673232215658692ecccb18765c53387cd4a63d825a15389bcca7d733bc7d",
    "bd3a056a67bace9436db95aa5bbeba084787fdabc3d4a43854476c626122c25a",
    "64cdc250e2231ca5e8e7c8687c5b3ac97f01585a5ab3da3e9d895ebf43aa5fe6",
    "0fe6236b25d70694975c4717e0f0a8630b02a027103fc82219a8f526ae8194e9",
    "213bd1682ebc0fd4b9920af18a28f18b404d3e388a3be63153d7f9dac38fa7f6",
    "da6fbe496d2a90df254597956563189031a7cd3d6b34bafb3beffaf26e40fa6d",
    "98e7bc90a60cf6aeb6699b46c199e22ba5853eb4aac2d6bbd7429e8483f551d6",
  ];

  test("wood textures preserve every pixel while batching canvas writes", () => {
    let variant = 0;
    for (const species of ["oak", "walnut"])
      for (const quiet of [false, true])
        for (const horizontal of [false, true]) {
          const data = new Uint8ClampedArray(64 * 64 * 4);
          let color;
          let uploads = 0;
          let draws = 0;
          const context = {
            canvas: { width: 64, height: 64 },
            createImageData: (width, height) => ({
              data: new Uint8ClampedArray(width * height * 4),
            }),
            putImageData(image, x, y) {
              assert.deepEqual([x, y], [0, 0]);
              data.set(image.data);
              uploads++;
            },
            set fillStyle(value) {
              color = value.match(/\d+/g).map(Number);
            },
            fillRect(x, y) {
              data.set([...color, 255], (y * 64 + x) * 4);
              draws++;
            },
          };
          paintWoodPlanks(context, quiet, species, horizontal);
          assert.equal(createHash("sha256").update(data).digest("hex"), fingerprints[variant++]);
          assert.equal(uploads, 1, "Upload the completed texture once");
          assert.equal(draws, 0, "Per-pixel canvas draws stall software rendering");
        }
  });
});
