import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, Image, Modal, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurTargetView } from "expo-blur";
import { Info, X } from "lucide-react-native";
import { RATIONALE } from "../shared";
import { T, F, tone, IMG, MIN_TOUCH } from "./theme";

/* ---------------------------------------------------------------
   SHARED PRIMITIVES — the native twin of the web mockup's kit.
   Every pressable is at least 44pt, every icon button has a label.
   --------------------------------------------------------------- */

const BACKGROUNDS = { canvas: T.canvas, aegean: T.aegean, forest: T.forest };

/** A full screen: background (a colour, or a photo that stays still while
 *  the content scrolls), paper grain, safe area and scrolling. A scrim over
 *  the photo keeps text on it readable. */
export const Screen = ({ bg = "canvas", image, blur = 0, scrim, children, scroll = true, footer, overlay, blurTarget, testID }) => {
  const Body = scroll ? ScrollView : View;
  // when a pop-up can blur this screen, everything below it must sit in the blur target
  const Content = blurTarget ? BlurTargetView : View;
  return (
    <View style={[s.fill, { backgroundColor: BACKGROUNDS[bg] }]} testID={testID}>
      <Content ref={blurTarget} style={s.fill}>
        {image && (
          <Image
            source={image}
            blurRadius={blur}
            resizeMode="cover"
            style={[StyleSheet.absoluteFill, { width: "100%", height: "100%" }]}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        )}
        {scrim && <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: scrim }]} />}
        <Image
          source={IMG.grain}
          resizeMode="repeat"
          style={[StyleSheet.absoluteFill, { width: "100%", height: "100%", opacity: image ? 0.3 : bg === "canvas" ? 0.9 : 0.35, mixBlendMode: "multiply" }]}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
        <SafeAreaView style={s.fill} edges={["top"]}>
          <Body
            style={s.fill}
            contentContainerStyle={scroll ? s.scrollBody : undefined}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </Body>
          {footer}
        </SafeAreaView>
      </Content>
      {overlay}
    </View>
  );
};

export const Eyebrow = ({ children, step, dark = false, style }) => {
  const c = tone(dark);
  return (
    <View style={[s.row, { gap: 8 }, style]}>
      {step != null && (
        <View style={[s.stepDot, { backgroundColor: c.text }]}>
          <Text style={{ fontFamily: F.sansSemi, fontSize: 10, color: dark ? T.aegean : T.canvas }}>{step}</Text>
        </View>
      )}
      <Text style={[s.eyebrow, { color: c.textSoft }]}>{children}</Text>
    </View>
  );
};

export const Serif = ({ size = 28, italic = false, color = T.ink, style, children, ...rest }) => (
  <Text
    style={[{ fontFamily: italic ? F.serifItalic : F.serif, fontSize: size, lineHeight: size * 1.22, color }, style]}
    {...rest}
  >
    {children}
  </Text>
);

export const Body = ({ size = 13.5, color = T.inkSoft, weight = "regular", style, children, ...rest }) => (
  <Text
    style={[
      {
        fontFamily: { regular: F.sans, medium: F.sansMed, semi: F.sansSemi, bold: F.sansBold }[weight],
        fontSize: size,
        lineHeight: size * 1.5,
        color,
      },
      style,
    ]}
    {...rest}
  >
    {children}
  </Text>
);

export const IconBtn = ({ label, onPress, dark = false, children, style }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={label}
    hitSlop={4}
    style={({ pressed }) => [s.iconBtn, { borderColor: tone(dark).hair, opacity: pressed ? 0.7 : 1 }, style]}
  >
    {children}
  </Pressable>
);

const VARIANTS = {
  primary: { bg: T.sage, fg: T.canvas, border: T.sage },
  dark: { bg: T.aegean, fg: T.canvas, border: T.aegean },
  warm: { bg: T.terracotta, fg: T.canvas, border: T.terracotta },
};

export const Button = ({ label, onPress, tone: variant = "primary", size = "lg", full = true, dark = false, icon: Icon, accessibilityLabel, selected, disabled = false }) => {
  const c = tone(dark);
  const v =
    VARIANTS[variant] ??
    (variant === "outline"
      ? { bg: "transparent", fg: c.text, border: c.text }
      : { bg: "transparent", fg: c.textSoft, border: "transparent" });
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled, ...(selected === undefined ? {} : { selected }) }}
      style={({ pressed }) => [
        s.button,
        size === "sm" ? s.buttonSm : s.buttonLg,
        { backgroundColor: v.bg, borderColor: v.border, alignSelf: full ? "stretch" : "flex-start", opacity: disabled ? 0.55 : pressed ? 0.85 : 1 },
      ]}
    >
      {Icon && <Icon size={size === "sm" ? 14 : 16} color={v.fg} />}
      <Text style={{ fontFamily: F.sansMed, fontSize: size === "sm" ? 12.5 : 15, color: v.fg }}>{label}</Text>
    </Pressable>
  );
};

export const Card = ({ dark = false, style, children, ...rest }) => {
  const c = tone(dark);
  return (
    <View style={[s.card, { backgroundColor: c.surface, borderColor: c.hair }, style]} {...rest}>
      {children}
    </View>
  );
};

/** Selection tile — the workhorse. Filled = chosen, never "correct". */
export const Tile = ({ icon: Icon, label, full, selected, onPress, dark = false, filled = false, accent = T.sage }) => {
  const c = tone(dark);
  const ink = selected && filled ? T.canvas : c.text;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={full || label}
      accessibilityState={{ selected: !!selected }}
      style={({ pressed }) => [
        s.tile,
        {
          backgroundColor: selected ? (filled ? accent : dark ? c.surfaceDeep : "rgba(91,107,74,0.12)") : c.surface,
          borderColor: selected ? accent : c.hair,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Icon size={22} strokeWidth={1.5} color={ink} />
      <Text numberOfLines={2} style={{ fontFamily: selected ? F.sansSemi : F.sans, fontSize: 11.5, color: ink, textAlign: "center" }}>
        {label}
      </Text>
    </Pressable>
  );
};

/** Two-way segmented choice. */
export const Switch = ({ value, onChange, leftLabel, rightLabel, label, dark = false }) => {
  const c = tone(dark);
  return (
    <View accessibilityLabel={label} style={[s.switch, { backgroundColor: dark ? "rgba(0,0,0,0.25)" : T.canvasDeep }]}>
      {[
        { l: leftLabel, v: false },
        { l: rightLabel, v: true },
      ].map(({ l, v }) => {
        const on = value === v;
        return (
          <Pressable
            key={l}
            onPress={() => onChange(v)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={[s.switchOpt, { backgroundColor: on ? (dark ? T.sage : T.aegean) : "transparent" }]}
          >
            <Text style={{ fontFamily: F.sansMed, fontSize: 12.5, color: on ? T.canvas : c.textSoft }}>{l}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};

export const ToggleRow = ({ label, sublabel, dark = false, ...rest }) => {
  const c = tone(dark);
  return (
    <Card dark={dark} style={{ marginBottom: 12, paddingVertical: 16 }}>
      <Body size={14} weight="medium" color={c.text}>
        {label}
      </Body>
      {sublabel && (
        <Body size={12} color={c.textSoft} style={{ marginBottom: 10 }}>
          {sublabel}
        </Body>
      )}
      <Switch dark={dark} label={label} {...rest} />
    </Card>
  );
};

export const Chip = ({ label, selected, onPress, icon: Icon, dark = false }) => {
  const c = tone(dark);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!selected }}
      style={[
        s.chip,
        { backgroundColor: selected ? T.aegean : dark ? c.surface : T.canvas, borderColor: selected ? T.aegean : c.hair },
      ]}
    >
      {Icon && <Icon size={14} color={selected ? T.canvas : c.text} />}
      <Text style={{ fontFamily: F.sansMed, fontSize: 12.5, color: selected ? T.canvas : c.text }}>{label}</Text>
    </Pressable>
  );
};

export const Dots = ({ total, active, dark = false }) => (
  <View style={[s.row, { justifyContent: "center", gap: 7 }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    {Array.from({ length: total }).map((_, i) => (
      <View
        key={i}
        style={{
          height: 5,
          borderRadius: 3,
          width: i === active ? 18 : 5,
          backgroundColor: i === active ? tone(dark).text : dark ? "rgba(242,239,230,0.3)" : "rgba(42,38,34,0.2)",
        }}
      />
    ))}
  </View>
);

export const SectionLabel = ({ children, dark = false }) => (
  <Text style={[s.eyebrow, { color: tone(dark).textSoft, marginBottom: 10 }]}>{children}</Text>
);

export const Plate = ({ source, height = 200, radius = 20, alt, style }) => (
  <Image
    source={source}
    accessibilityLabel={alt}
    accessible={!!alt}
    style={[{ width: "100%", height, borderRadius: radius, backgroundColor: T.canvasDeep }, style]}
    resizeMode="cover"
  />
);

/* ---------------------------------------------------------------
   PROGRESSIVE DISCLOSURE
   Layer 1: a calm instruction with an info icon.
   Layer 2: a half-screen rationale sheet.
   Layer 3: the sources, one tap further in.
   --------------------------------------------------------------- */

export const Instruction = ({ topic, dark = false }) => {
  const [open, setOpen] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const r = RATIONALE[topic];
  const c = tone(dark);
  const close = () => {
    setOpen(false);
    setShowSources(false);
  };

  return (
    <>
      <View style={[s.row, { gap: 6 }]}>
        <Body size={12.5} color={c.textSoft} style={{ flex: 1 }}>
          {r.instruction}
        </Body>
        <Pressable onPress={() => setOpen(true)} accessibilityRole="button" accessibilityLabel="Why this?" style={s.infoBtn}>
          <Info size={16} color={c.textSoft} strokeWidth={1.7} />
        </Pressable>
      </View>

      <Modal visible={open} transparent animationType="slide" onRequestClose={close}>
        <View style={s.sheetBackdrop}>
          <Pressable style={{ flex: 1 }} onPress={close} accessibilityRole="button" accessibilityLabel="Close" />
          <View style={s.sheet} accessibilityViewIsModal accessibilityLabel="Why this?">
            <View style={[s.row, { justifyContent: "space-between", marginBottom: 12 }]}>
              <Serif size={20}>Why this?</Serif>
              <IconBtn label="Close" onPress={close}>
                <X size={16} color={T.ink} />
              </IconBtn>
            </View>
            <ScrollView>
              <Body size={13.5} color={T.ink} style={{ marginBottom: 18 }}>
                {r.rationale}
              </Body>
              {showSources ? (
                <View accessibilityLabel="Sources" style={{ gap: 10 }}>
                  {r.sources.map((src) => (
                    <View key={src.label}>
                      <Body size={12.5} color={T.ink} weight="semi">
                        {src.kind} · <Body size={12.5}>{src.label}</Body>
                      </Body>
                      {!src.ref && <Body size={11.5}>Citation pending review.</Body>}
                    </View>
                  ))}
                </View>
              ) : (
                <Button tone="outline" size="sm" full={false} label="Show sources" onPress={() => setShowSources(true)} />
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

export const s = StyleSheet.create({
  fill: { flex: 1 },
  scrollBody: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 },
  row: { flexDirection: "row", alignItems: "center" },
  eyebrow: { fontFamily: F.sansSemi, fontSize: 10.5, letterSpacing: 2, textTransform: "uppercase" },
  stepDot: { width: 19, height: 19, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  iconBtn: { width: MIN_TOUCH, height: MIN_TOUCH, borderRadius: 22, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  infoBtn: { width: MIN_TOUCH, height: MIN_TOUCH, alignItems: "center", justifyContent: "center" },
  button: { minHeight: MIN_TOUCH, borderRadius: 999, borderWidth: 1.5, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  buttonLg: { paddingHorizontal: 28, paddingVertical: 12 },
  buttonSm: { paddingHorizontal: 16, paddingVertical: 8 },
  card: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 20, paddingVertical: 18 },
  tile: { flex: 1, minHeight: 84, borderRadius: 16, borderWidth: 1.5, alignItems: "center", justifyContent: "center", gap: 7, paddingHorizontal: 6, paddingVertical: 12 },
  switch: { flexDirection: "row", borderRadius: 999, padding: 3 },
  switchOpt: { flex: 1, minHeight: MIN_TOUCH - 4, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  chip: { minHeight: MIN_TOUCH, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1 },
  sheetBackdrop: { flex: 1, backgroundColor: "rgba(42,38,34,0.35)" },
  sheet: { height: "50%", backgroundColor: T.canvas, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 28 },
});
