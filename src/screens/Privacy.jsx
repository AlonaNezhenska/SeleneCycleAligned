import React, { useState } from "react";
import { ChevronLeft, ShieldCheck, Trash2 } from "lucide-react";
import { T, tone } from "../theme/tokens.js";
import { PRIVACY_AGREEMENT, PRIVACY_HEADLINE, PRIVACY_SUMMARY, DELETE_WARNING } from "../engine/index.js";
import { IconBtn, Button, Card, Eyebrow } from "../ui/primitives.jsx";

/* ---------------------------------------------------------------
   PRIVACY & DATA — the agreement, readable any time, and the one
   button that erases everything.
   --------------------------------------------------------------- */

/** The agreement itself, used both in onboarding and on this page. */
export const AgreementText = ({ dark = false }) => {
  const c = tone(dark);
  return (
    <div className="flex flex-col gap-3.5">
      {PRIVACY_AGREEMENT.map(({ title, body }) => (
        <div key={title}>
          <p className="sel-sans text-[13.5px] font-semibold" style={{ color: c.text }}>
            {title}
          </p>
          <p className="sel-sans text-[13px]" style={{ color: c.textSoft, lineHeight: 1.5 }}>
            {body}
          </p>
        </div>
      ))}
    </div>
  );
};

export const Privacy = ({ agreement, onDelete, back }) => {
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="sel-rise">
      <div className="flex items-center justify-between mb-6">
        <IconBtn label="Back" onClick={back}>
          <ChevronLeft size={17} color={T.ink} />
        </IconBtn>
        <Eyebrow>Privacy & data</Eyebrow>
        <div className="w-11" />
      </div>

      <h1 className="sel-serif flex items-center gap-2.5 mb-2" style={{ fontSize: 26, color: T.ink, lineHeight: 1.2 }}>
        <ShieldCheck size={22} color={T.sage} strokeWidth={1.6} aria-hidden="true" />
        {PRIVACY_HEADLINE}
      </h1>
      <p className="sel-sans text-[14px] mb-5" style={{ color: T.ink, lineHeight: 1.55 }}>
        {PRIVACY_SUMMARY}
      </p>

      <Card className="px-5 py-5 mb-5">
        <AgreementText />
        {agreement?.acceptedAt && (
          <p className="sel-sans text-[12px] mt-4" style={{ color: T.inkSoft }}>
            You agreed on{" "}
            {new Date(agreement.acceptedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.
          </p>
        )}
      </Card>

      {confirming ? (
        <Card className="px-5 py-5" role="region" aria-label="Confirm delete" style={{ background: T.canvasDeep }}>
          <p className="sel-sans text-[13.5px] font-semibold mb-1" style={{ color: T.ink }}>
            Delete everything?
          </p>
          <p className="sel-sans text-[13px] mb-4" style={{ color: T.inkSoft, lineHeight: 1.5 }}>
            {DELETE_WARNING}
          </p>
          <div className="flex flex-col gap-2.5">
            <Button tone="warm" onClick={onDelete}>
              Yes, delete everything
            </Button>
            <Button tone="outline" onClick={() => setConfirming(false)}>
              Keep my data
            </Button>
          </div>
        </Card>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="sel-sans w-full rounded-full flex items-center justify-center gap-2 text-[14px] font-medium sel-press"
          style={{ border: `1.5px solid ${T.terracotta}`, color: T.terracotta }}
        >
          <Trash2 size={16} aria-hidden="true" /> Delete all my data
        </button>
      )}
    </div>
  );
};
