import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, within, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SelenaApp from "../../SelenaApp.jsx";
import { findBlocked } from "../../engine/copy.js";

/** A fixed afternoon so the Pre-Flight nudge stays out of the way. */
const NOW = new Date(2026, 9, 29, 15, 0);
const iso = (daysAgo) => {
  const d = new Date(NOW);
  d.setDate(d.getDate() - daysAgo);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const renderApp = ({ tab = "home", profile = {} } = {}) =>
  render(<SelenaApp initialPhase="app" initialTab={tab} now={NOW} initialProfile={profile} />);

const nav = (name) => within(screen.getByRole("navigation", { name: "Main" })).getByRole("button", { name });

afterEach(() => vi.useRealTimers());

/** Tick the privacy agreement and move on. */
const agree = async (user) => {
  await user.click(screen.getByRole("checkbox", { name: /never shared/i }));
  await user.click(screen.getByRole("button", { name: "Agree and continue" }));
};

describe("Privacy agreement", () => {
  it("must be ticked before any data is asked for", async () => {
    const user = userEvent.setup();
    render(<SelenaApp now={NOW} />);
    await user.click(screen.getByRole("button", { name: /get started/i }));
    expect(screen.getByRole("heading", { name: /your data stays yours/i })).toBeInTheDocument();
    expect(screen.getByText(/never shared, sold or used for ads/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tick the box to continue" })).toBeDisabled();
    await agree(user);
    expect(screen.getByRole("radiogroup", { name: "Your intention" })).toBeInTheDocument();
  });

  it("remembers the finished onboarding after a reload", async () => {
    const user = userEvent.setup();
    const first = render(<SelenaApp now={NOW} />);
    await user.click(screen.getByRole("button", { name: /get started/i }));
    await agree(user);
    for (let i = 0; i < 3; i++) await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Skip for now" }));
    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
    first.unmount();

    render(<SelenaApp now={NOW} />);
    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
  });

  it("deletes everything from Privacy & data and starts over", async () => {
    const user = userEvent.setup();
    renderApp();
    localStorage.setItem("selena.onboarded", "true");
    await user.click(screen.getByRole("button", { name: "Privacy & data" }));
    expect(screen.getAllByText(/never shared/i).length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: /delete all my data/i }));
    await user.click(screen.getByRole("button", { name: "Yes, delete everything" }));
    expect(screen.getByRole("button", { name: /get started/i })).toBeInTheDocument();
    expect(localStorage.getItem("selena.onboarded")).not.toBe("true");
    expect(localStorage.getItem("selena.agreement") ?? "").not.toContain("acceptedAt");
  });
});

describe("Hide Numbers", () => {
  it("is on by default", () => {
    renderApp({ tab: "nutrition" });
    expect(screen.getByRole("button", { name: /hide numbers/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("meter-Energy")).toHaveTextContent("••");
    expect(screen.getByTestId("meter-Protein")).toHaveTextContent("••");
  });

  it("persists after a reload", async () => {
    const user = userEvent.setup();
    const first = renderApp({ tab: "nutrition" });
    await user.click(screen.getByRole("button", { name: /hide numbers/i }));
    expect(screen.getByTestId("meter-Protein")).toHaveTextContent("62 / 110 g");
    first.unmount();

    renderApp({ tab: "nutrition" });
    expect(screen.getByRole("button", { name: /hide numbers/i })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByTestId("meter-Protein")).toHaveTextContent("62 / 110 g");
  });
});

describe("Vibe Check", () => {
  const card = () => screen.getByRole("region", { name: "Today's prescription" });

  it("each option changes the prescription card", async () => {
    const user = userEvent.setup();
    renderApp();
    const seen = new Set();
    for (const [mode, title] of [
      ["Inward", "Recovery Day"],
      ["Steady", "Baseline Strength"],
      ["Outward", "Heavy Strength or SIT"],
    ]) {
      await user.click(screen.getByRole("radio", { name: new RegExp(mode) }));
      expect(within(card()).getByText(title)).toBeInTheDocument();
      seen.add(card().textContent);
    }
    expect(seen.size).toBe(3);
  });

  it("is keyboard-navigable with one tab stop and arrow keys", async () => {
    const user = userEvent.setup();
    renderApp();
    const group = screen.getByRole("radiogroup", { name: "Vibe Check" });
    const radios = within(group).getAllByRole("radio");
    expect(radios.filter((r) => r.tabIndex === 0)).toHaveLength(1);

    radios.find((r) => r.tabIndex === 0).focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: /Outward/ })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: /Outward/ })).toHaveFocus();
    expect(within(card()).getByText("Heavy Strength or SIT")).toBeInTheDocument();
  });

  it("prompts for a Vibe Check on birth control and defaults to Steady", () => {
    renderApp({ profile: { onBirthControl: true } });
    expect(screen.getByText(/tell us how today feels/i)).toBeInTheDocument();
    expect(within(card()).getByText("Baseline Strength")).toBeInTheDocument();
  });
});

describe("Imprint Zone", () => {
  it.each([1, 9, 15, 21, 27])("shows an affirmation with no digits on day %i", (day) => {
    renderApp({ profile: { lastPeriod: iso(day - 1) } });
    const zone = screen.getByRole("region", { name: "Today's imprint" });
    expect(zone.textContent.trim().length).toBeGreaterThan(0);
    expect(zone.textContent).not.toMatch(/\d/);
  });
});

describe("Late Luteal Fork", () => {
  it("shows the expanded check-in on day 27 and routes Hermit to wipeout", async () => {
    const user = userEvent.setup();
    renderApp({ profile: { lastPeriod: iso(26) } });
    await user.click(screen.getByRole("button", { name: /the hermit/i }));
    expect(screen.getByText(/low tide/i)).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Today's prescription" })).getByText("Recovery Day")).toBeInTheDocument();
  });

  it("is absent on day 21", () => {
    renderApp();
    expect(screen.queryByRole("button", { name: /the hermit/i })).not.toBeInTheDocument();
  });
});

describe("Triad Tracker", () => {
  it("saving shows exactly one tip", async () => {
    const user = userEvent.setup();
    renderApp({ tab: "tracker" });
    await user.click(screen.getByRole("button", { name: /fuel/i, expanded: false }));
    await user.click(screen.getByRole("button", { name: "Sweet / sugar" }));
    await user.click(screen.getByRole("button", { name: "Save entry" }));

    const tips = screen.getAllByRole("status", { name: "Tip" });
    expect(tips).toHaveLength(1);
    expect(tips[0]).toHaveTextContent(/dark chocolate/i);
    expect(tips[0]).toHaveTextContent(/pumpkin seeds/i);
  });

  it("Hermit gets permission for solitude", async () => {
    const user = userEvent.setup();
    renderApp({ tab: "tracker" });
    // clear the seeded log so the Hermit tip is the one that wins
    for (const name of ["Heavy", "Uterine cramps"]) await user.click(screen.getByRole("button", { name }));
    await user.click(screen.getByRole("button", { name: /mental/i, expanded: false }));
    await user.click(screen.getByRole("button", { name: "Brain fog" }));
    await user.click(screen.getByRole("button", { name: "The Hermit" }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByRole("status", { name: "Tip" })).toHaveTextContent(/solitude/i);
  });
});

describe("Training Protocol", () => {
  it("offers the Bailout at ten minutes, once", () => {
    vi.useFakeTimers({ now: NOW });
    renderApp({ tab: "workouts" });
    fireEvent.click(screen.getByRole("button", { name: /start session/i }));

    act(() => vi.advanceTimersByTime(9 * 60 * 1000 + 59 * 1000));
    expect(screen.queryByRole("alertdialog", { name: "Bailout" })).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByRole("alertdialog", { name: "Bailout" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Keep going" }));
    act(() => vi.advanceTimersByTime(5 * 60 * 1000));
    expect(screen.queryByRole("alertdialog", { name: "Bailout" })).not.toBeInTheDocument();
  });

  it("ending a session opens the 45-minute 35g protein window and earns the check", () => {
    vi.useFakeTimers({ now: NOW });
    renderApp({ tab: "workouts" });
    fireEvent.click(screen.getByRole("button", { name: /start session/i }));
    act(() => vi.advanceTimersByTime(20 * 60 * 1000));
    fireEvent.click(screen.getByRole("button", { name: /end session/i }));

    const win = screen.getByRole("region", { name: "Protein window" });
    expect(win).toHaveTextContent("35g+");
    expect(win).toHaveTextContent("45:00");
    expect(screen.getByRole("img", { name: "Done today" })).toBeInTheDocument();
  });

  it("shows the 15g Pre-Flight nudge before 11:00", () => {
    render(<SelenaApp initialPhase="app" initialTab="workouts" now={new Date(2026, 9, 29, 7, 0)} />);
    vi.useFakeTimers({ now: new Date(2026, 9, 29, 7, 0) });
    expect(screen.getByRole("region", { name: "Pre-Flight" })).toHaveTextContent("15g");
  });

  it("swaps spin to SIT on an Outward day", async () => {
    const user = userEvent.setup();
    renderApp({ profile: { lastPeriod: iso(8) } }); // day 9, follicular → Outward
    await user.click(nav("Workouts"));
    await user.click(screen.getByRole("button", { name: "Spin class" }));
    expect(screen.getByText(/Spin class swaps to SIT/)).toBeInTheDocument();
  });

  it("40+ on an Inward day gets rest with no plyometrics", async () => {
    const user = userEvent.setup();
    renderApp({ profile: { ageGroup: "40+", lastPeriod: iso(1) } }); // day 2 → Inward
    await user.click(nav("Workouts"));
    expect(screen.getByText("Recovery Day")).toBeInTheDocument();
    expect(screen.queryByText(/plyometrics/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Rest taken" }));
    expect(screen.getByRole("img", { name: "Done today" })).toBeInTheDocument();
  });
});

describe("Luteal Buffer", () => {
  it("is offered in the luteal phase", () => {
    renderApp({ tab: "nutrition" });
    expect(screen.getByRole("region", { name: "Luteal Buffer" })).toBeInTheDocument();
  });

  it("is hidden in the follicular phase", () => {
    renderApp({ tab: "nutrition", profile: { lastPeriod: iso(8) } });
    expect(screen.queryByRole("region", { name: "Luteal Buffer" })).not.toBeInTheDocument();
  });

  it("is hidden on hormonal birth control", () => {
    renderApp({ tab: "nutrition", profile: { onBirthControl: true } });
    expect(screen.queryByRole("region", { name: "Luteal Buffer" })).not.toBeInTheDocument();
  });

  it("never changes the target until accepted", async () => {
    const user = userEvent.setup();
    renderApp({ tab: "nutrition" });
    await user.click(screen.getByRole("button", { name: /hide numbers/i }));
    expect(screen.getByTestId("meter-Energy")).toHaveTextContent("1,070 / 1,850 kcal");
    await user.click(screen.getByRole("button", { name: "Use the buffer" }));
    expect(screen.getByTestId("meter-Energy")).toHaveTextContent("1,070 / 2,000–2,150 kcal");
  });
});

describe("Progressive disclosure", () => {
  it("opens the rationale drawer, then the sources", async () => {
    const user = userEvent.setup();
    renderApp({ tab: "nutrition" });
    const buffer = screen.getByRole("region", { name: "Luteal Buffer" });
    await user.click(within(buffer).getByRole("button", { name: "Why this?" }));
    const drawer = screen.getByRole("dialog", { name: "Why this?" });
    expect(drawer).toHaveTextContent(/never changes your target/i);
    await user.click(within(drawer).getByRole("button", { name: "Show sources" }));
    expect(within(drawer).getByRole("list", { name: "Sources" })).toBeInTheDocument();
  });
});

describe("Cycle Calendar", () => {
  const status = () => screen.getByRole("status", { name: "Selected day" });

  it("marks today and highlights the luteal phase on day 21", () => {
    renderApp({ tab: "cycle" });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/cycle calendar/i);
    expect(screen.getByText("YOU ARE HERE")).toBeInTheDocument();
    expect(status()).toHaveTextContent("Today · Day 21 of 28 · Early luteal");
    expect(screen.getByRole("button", { name: /^Luteal, days 17 to 28/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /^Follicular/ })).toHaveAttribute("aria-pressed", "false");
  });

  it("moves the marker with the keyboard and updates the phase", async () => {
    const user = userEvent.setup();
    renderApp({ tab: "cycle" });
    const slider = screen.getByRole("slider", { name: "Cycle day" });
    expect(slider).toHaveAttribute("aria-valuenow", "21");

    slider.focus();
    await user.keyboard("{End}");
    expect(slider).toHaveAttribute("aria-valuenow", "28");
    expect(status()).toHaveTextContent("Late luteal");
    await user.keyboard("{Home}");
    expect(status()).toHaveTextContent("Exploring · Day 1 of 28 · Menstrual");
    expect(screen.getByText("DAY 1")).toBeInTheDocument();
  });

  it("jumps to a phase when its label is tapped, and back to today", async () => {
    const user = userEvent.setup();
    renderApp({ tab: "cycle" });
    await user.click(screen.getByRole("button", { name: /^Ovulation, days 14 to 16/ }));
    expect(status()).toHaveTextContent("Day 14 of 28 · Ovulatory");
    await user.click(screen.getByRole("button", { name: "Back to today" }));
    expect(status()).toHaveTextContent("Today · Day 21 of 28");
  });

  it("scales the day ranges to a 35-day cycle", () => {
    renderApp({ tab: "cycle", profile: { cycleLength: 35 } });
    expect(screen.getByRole("button", { name: /^Luteal, days 21 to 35/ })).toBeInTheDocument();
  });

  it("has no calendar grid", () => {
    renderApp({ tab: "cycle" });
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});

describe("Copy on screen", () => {
  it.each(["home", "tracker", "cycle", "workouts", "nutrition"])("the %s tab shows no blocked phrase", (tab) => {
    renderApp({ tab });
    expect(findBlocked(document.body.textContent)).toEqual([]);
  });

  it("onboarding shows no blocked phrase on any step", async () => {
    const user = userEvent.setup();
    render(<SelenaApp now={NOW} />);
    const seen = [];
    seen.push(document.body.textContent);
    await user.click(screen.getByRole("button", { name: /get started/i }));
    seen.push(document.body.textContent);
    await agree(user);
    for (let i = 0; i < 3; i++) {
      seen.push(document.body.textContent);
      await user.click(screen.getByRole("button", { name: "Next" }));
    }
    seen.push(document.body.textContent);
    expect(screen.getAllByText(/scales lie/i).length).toBeGreaterThan(0);
    for (const text of seen) expect(findBlocked(text)).toEqual([]);
  });
});

describe("Accessibility basics", () => {
  it.each(["home", "tracker", "cycle", "workouts", "nutrition"])("every button on %s has an accessible name", (tab) => {
    renderApp({ tab });
    for (const b of screen.getAllByRole("button")) expect(b).toHaveAccessibleName();
  });

  it("onboarding fields have real labels", async () => {
    const user = userEvent.setup();
    render(<SelenaApp now={NOW} />);
    await user.click(screen.getByRole("button", { name: /get started/i }));
    await agree(user);
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByLabelText("Last period started")).toHaveAttribute("type", "date");
    expect(screen.getByLabelText("Cycle length (days)")).toHaveAttribute("type", "number");
  });
});
