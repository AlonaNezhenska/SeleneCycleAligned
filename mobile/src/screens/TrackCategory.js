import React, { useState } from "react";
import { View, Text, Pressable, TextInput, Image, ScrollView, Modal, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Check, Lock, Minus, Plus, Trash2, CalendarDays } from "lucide-react-native";
import { useApp, dateKey } from "../state/AppState";
import { useTracker } from "../state/TrackerSession";
import { CATEGORY, CONTRACEPTION_METHODS, CONTRACEPTION_SIDE_EFFECTS, CONDITIONS, FREQUENCIES, titleOf } from "../content/journal";
import { T, F, IMG, DARK_TEXT } from "../ui/theme";
import { IconBtn, Serif, Body, Chip, s } from "../ui/kit";
import { Calendar, shortDate } from "../ui/Calendar";
import { FlowerIntensity } from "../ui/FlowerIntensity";

/* ---------------------------------------------------------------
   CATEGORY SHEET — one category of today's journal on the blurred moss:
   a spaced capital label, an italic serif heading, the category's animal,
   glass tiles for the options, then the intensity and note panels.

   Everything here edits the tracking session only; Continue closes the
   sheet, and the tracker's single Save button writes the whole session.
   --------------------------------------------------------------- */

const OLIVE = "#4A4A2B";
const GLASS = "rgba(242,239,230,0.74)";
/** Line and text colour on the dark moss background. */
const CREAM = DARK_TEXT.text;

/* ---- watercolour companions ---- */

/** Each category has its own watercolour animal in the top corner. */
const ANIMALS = {
  physical: require("../../assets/images/animals/physical.png"),
  emotional: require("../../assets/images/animals/emotional.png"),
  energy: require("../../assets/images/animals/energy.png"),
  sleep: require("../../assets/images/animals/sleep.png"),
  skin: require("../../assets/images/animals/skin.png"),
  digestion: require("../../assets/images/animals/digestion.png"),
  flow: require("../../assets/images/animals/flow.png"),
  cravings: require("../../assets/images/animals/cravings.png"),
  intimacy: require("../../assets/images/animals/intimacy.png"),
  activities: require("../../assets/images/animals/activities.png"),
  disruptions: require("../../assets/images/animals/disruptions.png"),
  contraception: require("../../assets/images/animals/contraception.png"),
  medication: require("../../assets/images/animals/medication.png"),
  supplements: require("../../assets/images/animals/supplements.png"),
  conditions: require("../../assets/images/animals/conditions.png"),
};

const Companion = ({ categoryKey }) =>
  ANIMALS[categoryKey] ? (
    <Image
      source={ANIMALS[categoryKey]}
      resizeMode="contain"
      fadeDuration={0}
      accessibilityElementsHidden
      importantForAccessibility="no"
      testID={`companion-${categoryKey}`}
      style={{ width: 104, height: 112 }}
    />
  ) : null;

/** The watercolour mushrooms inside the note panel. */
const Mushrooms = () => (
  <Image
    source={require("../../assets/images/mushroom.png")}
    resizeMode="contain"
    fadeDuration={0}
    accessibilityElementsHidden
    importantForAccessibility="no"
    style={{ width: 48, height: 60 }}
  />
);

/* ---- small building blocks ---- */

const Glass = ({ children, style, ...rest }) => (
  <View style={[styles.glass, style]} {...rest}>
    {children}
  </View>
);

const Label = ({ children, style }) => (
  <Text style={[{ fontFamily: F.serif, fontSize: 17, color: T.ink, marginBottom: 10, textAlign: "center" }, style]}>{children}</Text>
);

const Field = ({ label, ...rest }) => (
  <View style={{ marginBottom: 10 }}>
    <Text style={{ fontFamily: F.sans, fontSize: 12.5, color: T.inkSoft, marginBottom: 4 }}>{label}</Text>
    <TextInput accessibilityLabel={label} placeholderTextColor={T.inkSoft} style={styles.input} {...rest} />
  </View>
);

/** A rounded glass tile, three to a row; chosen tiles turn olive with a check. */
const Tile = ({ option, on, onPress, focused }) => {
  const Icon = option.icon;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      accessibilityLabel={option.label}
      style={styles.tileCell}
    >
      <View style={[styles.tile, on && styles.tileOn, focused && styles.tileFocused]}>
        <Icon size={26} color={on ? T.canvas : OLIVE} strokeWidth={1.2} />
        <Text numberOfLines={2} style={[styles.tileText, { color: on ? T.canvas : T.ink }]}>
          {option.label}
        </Text>
        {on && (
          <View style={styles.check}>
            <Check size={13} color={OLIVE} strokeWidth={2.6} />
          </View>
        )}
      </View>
    </Pressable>
  );
};

const TileGrid = ({ options, isOn, onPress, focusedKey }) => (
  <View style={styles.grid}>
    {options.map((o) => (
      <Tile key={o.key} option={o} on={isOn(o.key)} focused={focusedKey === o.key} onPress={() => onPress(o.key)} />
    ))}
  </View>
);

const NumberStep = ({ label, value, unit, step, min = 0, onChange }) => (
  <View style={[s.row, { justifyContent: "space-between", marginTop: 6 }]}>
    <Body size={13} color={T.ink}>
      {label}
    </Body>
    <View style={[s.row, { gap: 4 }]}>
      <IconBtn label={`Less ${label.toLowerCase()}`} onPress={() => onChange(Math.max(min, Math.round((value - step) * 10) / 10))} style={{ borderWidth: 0 }}>
        <Minus size={15} color={T.ink} />
      </IconBtn>
      <Text accessibilityLiveRegion="polite" style={{ minWidth: 70, textAlign: "center", fontFamily: F.sansMed, fontSize: 14, color: T.ink }}>{`${value} ${unit}`}</Text>
      <IconBtn label={`More ${label.toLowerCase()}`} onPress={() => onChange(Math.round((value + step) * 10) / 10)} style={{ borderWidth: 0 }}>
        <Plus size={15} color={T.ink} />
      </IconBtn>
    </View>
  </View>
);

const NotePanel = ({ label, value, onChange, a11y }) => (
  <Glass style={{ flexDirection: "row", alignItems: "flex-end", gap: 8 }}>
    <View style={{ flex: 1 }}>
      <Text style={{ fontFamily: F.sansMed, fontSize: 14, color: T.ink, marginBottom: 4 }}>{label}</Text>
      <TextInput
        value={value ?? ""}
        onChangeText={onChange}
        placeholder="e.g. feels worse in the evening..."
        placeholderTextColor={T.inkSoft}
        accessibilityLabel={a11y ?? label}
        multiline
        style={{ minHeight: 40, fontFamily: F.serifItalic, fontSize: 14, color: T.ink, paddingVertical: 6 }}
      />
    </View>
    <Mushrooms />
  </Glass>
);

const DateLine = ({ label, value, today, onChange }) => {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ marginTop: 4 }}>
      <Pressable onPress={() => setOpen(!open)} accessibilityRole="button" accessibilityLabel={`${label}: ${value ? shortDate(value) : "not set"}. Change date`} style={[s.row, { gap: 8, minHeight: 44 }]}>
        <CalendarDays size={15} color={OLIVE} />
        <Body size={13} color={T.ink}>{`${label}: ${value ? shortDate(value) : "not set"}`}</Body>
      </Pressable>
      {open && (
        <Calendar
          mode="single"
          value={value ?? today}
          maxDate={today}
          onChange={(d) => {
            onChange(d);
            setOpen(false);
          }}
        />
      )}
    </View>
  );
};

const ItemCard = ({ title, children }) => (
  <Glass style={{ marginBottom: 10 }} accessibilityLabel={`${title} details`}>
    <Body size={14} weight="semi" color={T.ink}>
      {title}
    </Body>
    {children}
  </Glass>
);

/* ---- symptoms: tiles, and a window that slides up for the one in focus ---- */

/**
 * Tap a tile to choose it, or tap a chosen tile to open it again. Either
 * way a window slides up from the bottom with that symptom's flower,
 * slider and note. It covers only the lower part of the screen, so the
 * tiles stay in view above it. Tapping above the window or Done closes it.
 */
const Symptoms = ({ cat, entry, t, options = cat.options }) => {
  const items = entry.items ?? {};
  const chosen = options.filter((o) => items[o.key]);
  const [focus, setFocus] = useState(null);
  // while the slider is being dragged the window must not scroll under the finger
  const [dragging, setDragging] = useState(false);
  const current = chosen.find((o) => o.key === focus);

  const press = (key) => {
    if (!items[key]) {
      const o = options.find((x) => x.key === key);
      t.toggleItem(cat.key, key, o.noIntensity ? {} : { intensity: 3 });
    }
    setFocus(key);
  };
  const close = () => setFocus(null);
  const remove = () => {
    t.toggleItem(cat.key, current.key);
    setFocus(null);
  };

  return (
    <>
      <TileGrid options={options} isOn={(k) => Boolean(items[k])} onPress={press} focusedKey={current?.key} />
      {cat.noteLabel && cat.type === "symptoms" && <NotePanel label={cat.noteLabel} value={entry.note} onChange={(v) => t.setNote(cat.key, v)} />}

      <Modal visible={Boolean(current)} transparent animationType="slide" onRequestClose={close}>
        <View style={styles.windowBackdrop}>
          <Pressable style={{ flex: 1 }} onPress={close} accessibilityRole="button" accessibilityLabel="Close" />
          {current && (
            <View style={styles.window} testID="intensity-panel">
              <View style={styles.handle} />
              <ScrollView
                scrollEnabled={!dragging}
                contentContainerStyle={{ paddingBottom: 8 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <Label>{current.noIntensity ? current.label : `How intense is ${current.label.toLowerCase()}?`}</Label>
                {chosen.length > 1 && (
                  <View style={[s.row, { flexWrap: "wrap", justifyContent: "center", gap: 6, marginBottom: 6 }]}>
                    {chosen.map((o) => (
                      <Chip key={o.key} label={o.label} selected={o.key === current.key} onPress={() => setFocus(o.key)} />
                    ))}
                  </View>
                )}
                {!current.noIntensity && (
                  <FlowerIntensity
                    label={current.label}
                    value={items[current.key].intensity ?? 3}
                    direction={current.positive ? "open" : "close"}
                    onChange={(n) => t.setItem(cat.key, current.key, { intensity: n })}
                    onDragChange={setDragging}
                  />
                )}
                <View style={{ marginTop: 12 }}>
                  <NotePanel
                    label="Add a note (optional)"
                    a11y={`Note for ${current.label}`}
                    value={items[current.key].note}
                    onChange={(note) => t.setItem(cat.key, current.key, { note })}
                  />
                </View>
              </ScrollView>
              <View style={[s.row, { gap: 10, marginTop: 8 }]}>
                <Pressable onPress={remove} accessibilityRole="button" accessibilityLabel={`Remove ${current.label}`} style={styles.removeBtn}>
                  <Text style={{ fontFamily: F.serif, fontSize: 16, color: T.ink }}>Remove</Text>
                </Pressable>
                <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="Done" style={[styles.continue, { flex: 1, minHeight: 50 }]}>
                  <Text style={[styles.continueText, { fontSize: 18 }]}>Done</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
};

/* ---- the other input types ---- */

const Choices = ({ cat, entry, t }) => {
  const items = entry.items ?? {};
  return (
    <>
      {cat.groups.map((g) => (
        <View key={g.key} style={{ marginBottom: 12 }}>
          <Text style={styles.groupLabel}>{g.single ? `${g.label} · pick one` : g.label}</Text>
          {g.single ? (
            <Glass>
              <View style={[s.row, { flexWrap: "wrap", gap: 8 }]} accessibilityRole="radiogroup" accessibilityLabel={g.label}>
                {g.options.map((o) => (
                  <Chip key={o.key} label={o.label} selected={entry.choices?.[g.key] === o.key} onPress={() => t.setChoice(cat.key, g.key, o.key)} />
                ))}
              </View>
            </Glass>
          ) : (
            <TileGrid options={g.options} isOn={(k) => Boolean(items[k])} onPress={(k) => t.toggleItem(cat.key, k)} />
          )}
        </View>
      ))}
      {cat.hint && (
        <Body size={12.5} color={DARK_TEXT.textSoft} style={styles.hint}>
          {cat.hint}
        </Body>
      )}
      <NotePanel label={cat.noteLabel ?? "Private note (optional)"} value={entry.note} onChange={(v) => t.setNote(cat.key, v)} />
    </>
  );
};

const Activities = ({ cat, entry, t }) => {
  const items = entry.items ?? {};
  const chosen = cat.options.filter((o) => items[o.key]);
  const set = (k, patch) => t.setItem(cat.key, k, patch);
  return (
    <>
      <TileGrid
        options={cat.options}
        isOn={(k) => Boolean(items[k])}
        onPress={(k) => t.toggleItem(cat.key, k, cat.options.find((o) => o.key === k).noDuration ? {} : { duration: 30 })}
      />
      {chosen.map((o) => {
        const v = items[o.key];
        return (
          <ItemCard key={o.key} title={o.label}>
            {!o.noDuration && <NumberStep label="Duration" value={v.duration ?? 30} unit="min" step={5} onChange={(n) => set(o.key, { duration: n })} />}
            {o.extra === "intensity" && (
              <FlowerIntensity label={o.label} value={v.intensity ?? 3} direction="open" onChange={(n) => set(o.key, { intensity: n })} />
            )}
            {o.extra === "distance" && <NumberStep label="Distance" value={v.distance ?? 0} unit="km" step={0.5} onChange={(n) => set(o.key, { distance: n })} />}
            {o.extra === "steps" && <Field label="Steps (optional)" keyboardType="number-pad" value={v.steps ?? ""} onChangeText={(x) => set(o.key, { steps: x })} />}
            {o.extra === "type" && <Field label="Type of yoga (optional)" value={v.type ?? ""} onChangeText={(x) => set(o.key, { type: x })} />}
            {o.extra === "name" && <Field label="What did you do?" value={v.name ?? ""} onChangeText={(x) => set(o.key, { name: x })} />}
            {o.extra === "recovery" && (
              <View style={[s.row, { flexWrap: "wrap", gap: 8, marginTop: 6 }]}>
                {["Full rest", "Gentle movement", "Stretching"].map((r) => (
                  <Chip key={r} label={r} selected={v.recovery === r} onPress={() => set(o.key, { recovery: r })} />
                ))}
              </View>
            )}
          </ItemCard>
        );
      })}
    </>
  );
};

const Events = ({ cat, entry, t, today }) => {
  const items = entry.items ?? {};
  const chosen = cat.options.filter((o) => items[o.key]);
  return (
    <>
      <TileGrid options={cat.options} isOn={(k) => Boolean(items[k])} onPress={(k) => t.toggleItem(cat.key, k, { date: today })} />
      {chosen.map((o) => (
        <ItemCard key={o.key} title={o.label}>
          <DateLine label="Date" value={items[o.key].date} today={today} onChange={(d) => t.setItem(cat.key, o.key, { date: d })} />
          <TextInput
            value={items[o.key].note ?? ""}
            onChangeText={(note) => t.setItem(cat.key, o.key, { note })}
            placeholder="Add a note (optional)"
            placeholderTextColor={T.inkSoft}
            accessibilityLabel={`Note for ${o.label}`}
            style={[styles.input, { fontFamily: F.serifItalic, marginTop: 4 }]}
          />
        </ItemCard>
      ))}
    </>
  );
};

const EMPTY_ENTRY = { name: "", dosage: "", time: "", frequency: "", reason: "", notes: "" };

const Entries = ({ cat, entry, t }) => {
  const [form, setForm] = useState(EMPTY_ENTRY);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const thing = cat.key === "medication" ? "medication" : "supplement";
  return (
    <>
      {(entry.entries ?? []).map((e) => (
        <ItemCard key={e.id} title={[e.name, e.dosage].filter(Boolean).join(" · ")}>
          <Body size={12.5}>{[e.time && `at ${e.time}`, e.frequency, e.reason, e.notes].filter(Boolean).join(" · ") || "No details"}</Body>
          <Pressable onPress={() => t.removeEntry(cat.key, e.id)} accessibilityRole="button" accessibilityLabel={`Remove ${e.name}`} style={[s.row, { gap: 6, minHeight: 44 }]}>
            <Trash2 size={14} color={T.terracotta} />
            <Body size={12.5} color={T.terracotta}>
              Remove
            </Body>
          </Pressable>
        </ItemCard>
      ))}

      <Glass>
        <Label>{`Add a ${thing}`}</Label>
        {cat.suggestions.length > 0 && (
          <View style={[s.row, { flexWrap: "wrap", gap: 8, marginBottom: 10 }]}>
            {cat.suggestions.map((n) => (
              <Chip key={n} label={n} selected={form.name === n} onPress={() => set({ name: n })} />
            ))}
          </View>
        )}
        <Field label="Name" value={form.name} onChangeText={(v) => set({ name: v })} />
        <View style={[s.row, { gap: 10 }]}>
          <View style={{ flex: 1 }}>
            <Field label="Dosage" value={form.dosage} onChangeText={(v) => set({ dosage: v })} placeholder="e.g. 200 mg" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Time taken" value={form.time} onChangeText={(v) => set({ time: v })} placeholder="e.g. 08:30" />
          </View>
        </View>
        <Text style={{ fontFamily: F.sans, fontSize: 12.5, color: T.inkSoft, marginBottom: 6 }}>How often</Text>
        <View style={[s.row, { flexWrap: "wrap", gap: 8, marginBottom: 10 }]}>
          {FREQUENCIES.map((fq) => (
            <Chip key={fq} label={fq} selected={form.frequency === fq} onPress={() => set({ frequency: form.frequency === fq ? "" : fq })} />
          ))}
        </View>
        {cat.fields.includes("reason") && <Field label="Reason (optional)" value={form.reason} onChangeText={(v) => set({ reason: v })} />}
        <Field label="Notes (optional)" value={form.notes} onChangeText={(v) => set({ notes: v })} multiline />
        <Pressable
          onPress={() => {
            t.addEntry(cat.key, { ...form, name: form.name.trim() });
            setForm(EMPTY_ENTRY);
          }}
          disabled={!form.name.trim()}
          accessibilityRole="button"
          accessibilityState={{ disabled: !form.name.trim() }}
          accessibilityLabel={`Add ${thing}`}
          style={[styles.addBtn, !form.name.trim() && { opacity: 0.45 }]}
        >
          <Plus size={16} color={T.canvas} />
          <Text style={{ fontFamily: F.sansMed, fontSize: 14, color: T.canvas }}>{`Add ${thing}`}</Text>
        </Pressable>
      </Glass>
    </>
  );
};

const Contraception = ({ cat, entry, t, profile, today }) => {
  const current = { ...profile.contraception, ...t.profileDraft.contraception };
  const method = CONTRACEPTION_METHODS.find((m) => m.key === current.method);
  const items = entry.items ?? {};
  return (
    <>
      <Glass>
        <Label>Your method</Label>
        <View style={[s.row, { flexWrap: "wrap", gap: 8 }]} accessibilityRole="radiogroup" accessibilityLabel="Birth control method">
          {CONTRACEPTION_METHODS.map((m) => (
            <Chip key={m.key} label={m.label} selected={current.method === m.key} onPress={() => t.setProfileChange(cat.key, { method: m.key, changedOn: today })} />
          ))}
        </View>
        <Body size={12} style={{ marginTop: 8 }}>
          Changing your method updates your profile when you save. Hormonal methods switch Selena to following your Vibe Check.
        </Body>
        {method && method.key !== "none" && (
          <>
            <DateLine label="Started" value={current.startDate} today={today} onChange={(d) => t.setProfileChange(cat.key, { startDate: d })} />
            <DateLine label="Stopped" value={current.endDate} today={today} onChange={(d) => t.setProfileChange(cat.key, { endDate: d })} />
          </>
        )}
        {method?.pill && (
          <NumberStep
            label="Pills not taken today"
            value={items.notTaken?.count ?? 0}
            unit=""
            step={1}
            onChange={(n) => (n === 0 && items.notTaken ? t.toggleItem(cat.key, "notTaken") : t.setItem(cat.key, "notTaken", { count: n }))}
          />
        )}
      </Glass>

      <Text style={[styles.groupLabel, { marginTop: 12 }]}>Side effects you noticed today</Text>
      <TileGrid options={CONTRACEPTION_SIDE_EFFECTS} isOn={(k) => Boolean(items[k])} onPress={(k) => t.toggleItem(cat.key, k)} />
      <NotePanel label="Changes or notes (optional)" value={entry.note} onChange={(v) => t.setNote(cat.key, v)} />
    </>
  );
};

const Health = ({ cat, entry, t, profile, today }) => {
  const current = { conditions: [], ...profile.health, ...t.profileDraft.conditions };
  const toggleCondition = (k) =>
    t.setProfileChange(cat.key, {
      conditions: current.conditions.includes(k) ? current.conditions.filter((x) => x !== k) : [...current.conditions, k],
    });
  return (
    <>
      <Glass>
        <Body size={12.5} color={T.ink}>
          This is context you choose to share with yourself. Selena never guesses at a condition from what you log, and nothing here is a
          diagnosis.
        </Body>
      </Glass>

      <Glass>
        <Label>Your health profile</Label>
        <View style={[s.row, { flexWrap: "wrap", gap: 8, marginBottom: 6 }]}>
          {CONDITIONS.map((cnd) => (
            <Chip key={cnd.key} label={cnd.label} selected={current.conditions.includes(cnd.key)} onPress={() => toggleCondition(cnd.key)} />
          ))}
        </View>
        {current.conditions.length > 0 && (
          <>
            <DateLine label="Diagnosed" value={current.diagnosisDate} today={today} onChange={(d) => t.setProfileChange(cat.key, { diagnosisDate: d })} />
            <Field label="Treatment (optional)" value={current.treatment ?? ""} onChangeText={(v) => t.setProfileChange(cat.key, { treatment: v })} />
            <Field label="Personal observations (optional)" value={current.observations ?? ""} onChangeText={(v) => t.setProfileChange(cat.key, { observations: v })} multiline />
          </>
        )}
      </Glass>

      <Text style={[styles.groupLabel, { marginTop: 4 }]}>Today's observations</Text>
      <Symptoms cat={cat} entry={entry} t={t} options={cat.observations} />
    </>
  );
};

const SECTIONS = { symptoms: Symptoms, choices: Choices, activities: Activities, events: Events, entries: Entries, contraception: Contraception, health: Health };

const HEADING = {
  symptoms: "Select what you're experiencing today",
  choices: "Only what you want to note today",
  activities: "Select everything you did today",
  events: "Anything that happened this cycle",
  entries: "Add what you took today",
  contraception: "Your method, and how today felt",
  health: "Context for you, and how today felt",
};

/* ---- the sheet ---- */

/** One category, drawn as the pop-up sheet (or a full page from a link). */
export function CategorySheet({ categoryKey, onClose }) {
  const cat = CATEGORY[categoryKey];
  const { profile, now } = useApp();
  const t = useTracker();
  const today = dateKey(now);

  if (!cat) {
    return (
      <View style={[styles.sheet, { padding: 24, backgroundColor: T.canvas }]}>
        <Serif size={22}>This category could not be found.</Serif>
        <Pressable onPress={onClose} accessibilityRole="button" style={[styles.continue, { marginTop: 16 }]}>
          <Text style={styles.continueText}>Back to the tracker</Text>
        </Pressable>
      </View>
    );
  }

  const Section = SECTIONS[cat.type];
  const entry = t.draft[cat.key] ?? {};

  return (
    <View style={styles.sheet} testID="category-sheet">
      <Image
        source={IMG.backgrounds.tracker}
        blurRadius={18}
        resizeMode="cover"
        style={[StyleSheet.absoluteFill, { width: "100%", height: "100%" }]}
      />
      <LinearGradient
        colors={["rgba(10,18,12,0.6)", "rgba(10,18,12,0.42)", "rgba(10,18,12,0.62)"]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 12 }} showsVerticalScrollIndicator={false}>
        <View style={[s.row, { justifyContent: "space-between" }]}>
          <IconBtn label="Back to the tracker" onPress={onClose} style={styles.roundBtn}>
            <ArrowLeft size={20} color={T.ink} />
          </IconBtn>
          {cat.private && (
            <View style={[s.row, styles.privatePill]}>
              <Lock size={12} color={OLIVE} />
              <Body size={11.5} color={T.ink}>
                Private
              </Body>
            </View>
          )}
        </View>

        <View style={[s.row, { alignItems: "flex-start", marginTop: 10 }]}>
          <View style={{ flex: 1 }}>
            <View style={[s.row, { gap: 10, marginBottom: 8 }]}>
              <Text style={styles.eyebrow} accessibilityRole="header">
                {titleOf(cat).toUpperCase()}
              </Text>
              <View style={styles.rule} />
            </View>
            <Text style={styles.heading}>{HEADING[cat.type]}</Text>
            {cat.private && (
              <Body size={12} color={DARK_TEXT.textSoft} style={{ marginTop: 6 }}>
                Stays on this phone and is never backed up.
              </Body>
            )}
          </View>
          <Companion categoryKey={cat.key} />
        </View>

        <View style={{ gap: 12, marginTop: 14 }}>
          <Section cat={cat} entry={entry} t={t} profile={profile} today={today} />
        </View>
      </ScrollView>

      <View style={styles.sheetFooter}>
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Continue" style={styles.continue}>
          <Text style={styles.continueText}>Continue</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** The same sheet as a full page, for links straight to a category. */
export function TrackCategory({ categoryKey }) {
  const params = useLocalSearchParams();
  const key = categoryKey ?? params.category;
  const back = () => (router.canGoBack?.() ? router.back() : router.replace("/tracker"));
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.canvas }}>
      <CategorySheet categoryKey={key} onClose={back} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, overflow: "hidden" },
  roundBtn: { width: 52, height: 52, borderRadius: 26, borderWidth: 0, backgroundColor: "rgba(242,239,230,0.82)" },
  privatePill: { gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: "rgba(242,239,230,0.82)" },
  eyebrow: { fontFamily: F.serif, fontSize: 15, letterSpacing: 4, color: CREAM },
  rule: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: CREAM, opacity: 0.7 },
  heading: { fontFamily: F.serifItalic, fontSize: 28, lineHeight: 34, color: CREAM },
  glass: { borderRadius: 28, padding: 16, backgroundColor: GLASS, borderWidth: 1, borderColor: "rgba(255,253,248,0.7)" },
  groupLabel: { fontFamily: F.serif, fontSize: 16, color: CREAM, marginBottom: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -5 },
  tileCell: { width: "33.333%", padding: 5 },
  tile: {
    minHeight: 104,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 6,
    paddingVertical: 12,
    backgroundColor: GLASS,
    borderWidth: 1,
    borderColor: "rgba(255,253,248,0.75)",
  },
  tileOn: { backgroundColor: OLIVE, borderColor: OLIVE },
  tileFocused: { borderColor: "#F2E2A6", borderWidth: 2 },
  tileText: { fontFamily: F.sans, fontSize: 13.5, textAlign: "center" },
  check: { position: "absolute", top: 6, right: 8, width: 24, height: 24, borderRadius: 12, backgroundColor: T.canvas, alignItems: "center", justifyContent: "center" },
  hint: { textAlign: "center", paddingHorizontal: 12 },
  input: { minHeight: 46, borderRadius: 16, borderWidth: 1, borderColor: "rgba(74,74,43,0.2)", backgroundColor: "rgba(255,253,248,0.65)", paddingHorizontal: 14, paddingVertical: 10, fontFamily: F.sans, fontSize: 14, color: T.ink },
  addBtn: { flexDirection: "row", gap: 8, minHeight: 48, borderRadius: 999, backgroundColor: OLIVE, alignItems: "center", justifyContent: "center", marginTop: 4 },
  sheetFooter: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 14 },
  windowBackdrop: { flex: 1, backgroundColor: "rgba(20,24,16,0.25)" },
  window: {
    maxHeight: "62%",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: "rgba(242,239,230,0.97)",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 22,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -4 },
    elevation: 16,
  },
  handle: { alignSelf: "center", width: 44, height: 5, borderRadius: 3, backgroundColor: "rgba(74,74,43,0.25)", marginBottom: 12 },
  removeBtn: { minHeight: 50, paddingHorizontal: 20, borderRadius: 999, borderWidth: 1, borderColor: "rgba(74,74,43,0.3)", alignItems: "center", justifyContent: "center" },
  continue: { minHeight: 56, borderRadius: 999, backgroundColor: OLIVE, alignItems: "center", justifyContent: "center" },
  continueText: { fontFamily: F.serif, fontSize: 21, color: T.canvas },
});
