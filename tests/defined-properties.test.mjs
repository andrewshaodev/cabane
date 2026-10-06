import assert from "node:assert/strict";
import test from "node:test";
import { withModules } from "./test-server.mjs";

await withModules(async (load) => {
  const { omitUndefinedProperties } = await load("/packages/engine/src/defined-properties.ts");
  test("optional record fields are omitted without discarding null, false, zero, or nested identity", () => {
    const nested = { value: undefined };
    const source = {
      absent: undefined,
      nullable: null,
      disabled: false,
      count: 0,
      label: "",
      nested,
    };
    const result = omitUndefinedProperties(source);
    assert.equal(Object.hasOwn(result, "absent"), false);
    assert.deepEqual(result, { nullable: null, disabled: false, count: 0, label: "", nested });
    assert.equal(result.nested, nested);
    assert.equal(Object.hasOwn(source, "absent"), true);
  });
});
