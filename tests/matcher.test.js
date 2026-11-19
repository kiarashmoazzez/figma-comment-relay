const test = require("node:test");
const assert = require("node:assert/strict");
const Matcher = require("../src/matcher.js");

function anchor(overrides = {}) {
  return {
    nodeId: "1:2",
    stableId: null,
    name: "Checkout button",
    type: "FRAME",
    pageName: "Checkout",
    path: [
      { name: "Checkout", type: "PAGE" },
      { name: "Desktop", type: "FRAME" },
      { name: "Checkout button", type: "FRAME" },
    ],
    bounds: { width: 160, height: 48 },
    text: "Pay now",
    ...overrides,
  };
}

test("stable anchors always win", () => {
  const source = anchor({ stableId: "relay-123" });
  const result = Matcher.findBestMatch(source, [
    anchor({ nodeId: "9:9", stableId: null }),
    anchor({ nodeId: "8:8", stableId: "relay-123", name: "Renamed" }),
  ]);
  assert.equal(result.target.nodeId, "8:8");
  assert.equal(result.score, 1);
  assert.equal(result.confidence, "high");
});

test("matching hierarchy beats a name-only match", () => {
  const source = anchor({ nodeId: "source" });
  const result = Matcher.findBestMatch(source, [
    anchor({ nodeId: "wrong", pageName: "Marketing", path: [{ name: "Marketing", type: "PAGE" }] }),
    anchor({ nodeId: "right" }),
  ]);
  assert.equal(result.target.nodeId, "right");
  assert.ok(result.score >= 0.9);
});

test("relative comment positions scale with the target", () => {
  const meta = { node_id: "1:2", node_offset: { x: 80, y: 24 }, region_width: 40, region_height: 12 };
  const mapped = Matcher.mapClientMeta(meta, anchor(), anchor({ nodeId: "4:5", bounds: { width: 320, height: 96 } }));
  assert.deepEqual(mapped, {
    node_id: "4:5",
    node_offset: { x: 160, y: 48 },
    region_width: 80,
    region_height: 24,
  });
});

test("manual placement creates a centered frame offset", () => {
  const meta = Matcher.createMetaForTarget(anchor({ nodeId: "6:7", bounds: { width: 200, height: 100 } }));
  assert.deepEqual(meta, { node_id: "6:7", node_offset: { x: 100, y: 50 } });
});
