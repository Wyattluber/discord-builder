// A CommonJS bot can require() the core and the runtime.
const { test } = require("node:test");
const assert = require("node:assert/strict");

test("core and runtime load with require()", () => {
  const runtime = require("../dist/runtime.cjs");
  const core = require("../dist/core.cjs");
  assert.equal(typeof runtime.preparePayload, "function");
  assert.equal(typeof core.serialize, "function");
  assert.equal(runtime.COMPONENTS_V2_FLAG, core.IS_COMPONENTS_V2);
});
