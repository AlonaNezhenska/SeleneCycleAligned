import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { findBlocked } from "../../engine/copy.js";

/** Copy that only shows in rare states never reaches a render test, so the
 *  source is scanned too: every quoted string and every run of JSX text. */
const ROOTS = ["src/screens", "src/ui", "src"];
const files = ROOTS.flatMap((dir) =>
  readdirSync(dir)
    .filter((f) => f.endsWith(".jsx"))
    .map((f) => join(dir, f))
);

const copyIn = (src) => [
  ...[...src.matchAll(/"([^"\n]*)"|`([^`]*)`/g)].map((m) => m[1] ?? m[2]),
  ...[...src.matchAll(/>([^<>{}\n]+)</g)].map((m) => m[1]),
];

describe("UI source copy", () => {
  it("finds the screen files", () => {
    expect(files.length).toBeGreaterThanOrEqual(7);
  });

  it.each(files)("%s has no blocked phrase in any string or JSX text", (file) => {
    const hits = copyIn(readFileSync(file, "utf8")).filter((s) => findBlocked(s).length);
    expect(hits).toEqual([]);
  });
});
