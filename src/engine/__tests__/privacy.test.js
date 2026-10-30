import { describe, it, expect } from "vitest";
import {
  PRIVACY_AGREEMENT,
  PRIVACY_SUMMARY,
  PRIVACY_HEADLINE,
  AGREE_LABEL,
  DELETE_WARNING,
  AGREEMENT_VERSION,
} from "../privacy.js";
import { findBlocked } from "../copy.js";

const all = [PRIVACY_HEADLINE, PRIVACY_SUMMARY, AGREE_LABEL, DELETE_WARNING, ...PRIVACY_AGREEMENT.flatMap((s) => [s.title, s.body])];

describe("privacy agreement", () => {
  it("says plainly that data is never shared and stays on the device", () => {
    const text = all.join(" ").toLowerCase();
    expect(text).toContain("never shared");
    expect(text).toContain("stays on this device");
    expect(text).toContain("only you can see it");
    expect(text).toContain("unless you choose to back it up");
    expect(text).toContain("never uploaded");
    expect(AGREE_LABEL.toLowerCase()).toContain("never shared");
  });

  it("covers storage, sharing, the photo, deletion and medical limits", () => {
    const titles = PRIVACY_AGREEMENT.map((s) => s.title.toLowerCase()).join(" | ");
    for (const word of ["device", "backup", "shared", "photo", "control", "medical"]) expect(titles).toContain(word);
  });

  it("has a version so a changed agreement can be asked again", () => {
    expect(Number.isInteger(AGREEMENT_VERSION)).toBe(true);
  });

  it("passes the copy blocklist", () => {
    for (const s of all) expect(findBlocked(s), s).toEqual([]);
  });
});
