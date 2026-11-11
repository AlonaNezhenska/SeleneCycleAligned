import React, { useRef, useState } from "react";
import { View, Text, Pressable, TextInput, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { ArrowLeft } from "lucide-react-native";
import { useApp } from "../state/AppState";
import { MEAL, defaultGrams, foodEntry } from "../lib/food";
import { lookupBarcode } from "../lib/openFoodFacts";
import { OLIVE, diaryDay } from "../ui/food";
import { FoodDetail } from "../ui/FoodDetail";
import { T, F } from "../ui/theme";
import { Screen, Body, Serif, IconBtn, s } from "../ui/kit";

/* ---------------------------------------------------------------
   SCAN A BARCODE — point the camera at a packet. Only the barcode
   number is looked up; if the product is not known, it can be created
   with the barcode already filled in. Typing the number works too.
   --------------------------------------------------------------- */

const TYPES = ["ean13", "ean8", "upc_a", "upc_e"];

export function FoodScan() {
  const params = useLocalSearchParams();
  const meal = MEAL[params.meal] ? params.meal : "snacks";
  const { foodLibrary, addFoodEntries, hideNumbers, profile, todayKey } = useApp();
  const date = diaryDay(params.date, todayKey);
  const hidden = hideNumbers || profile.trackingStyle === "Visual plates";
  const [permission, requestPermission] = useCameraPermissions();
  const [state, setState] = useState({ status: "scanning" });
  const [typed, setTyped] = useState("");
  const busy = useRef(false);
  const back = () => (router.canGoBack?.() ? router.back() : router.replace("/nutrition"));

  const find = async (code) => {
    if (busy.current) return;
    busy.current = true;
    // her own foods first: a barcode she added to one finds it straight away, even offline
    const clean = String(code).replace(/\D/g, "");
    const mine = foodLibrary.foods.find((x) => x.barcode && x.barcode === clean);
    if (mine) {
      setState({ status: "found", code: clean, food: mine });
      return;
    }
    setState({ status: "looking", code });
    try {
      const food = await lookupBarcode(code);
      setState(food ? { status: "found", code, food } : { status: "missing", code });
    } catch {
      setState({ status: "offline", code });
    }
  };
  const again = () => {
    busy.current = false;
    setState({ status: "scanning" });
  };

  const camera =
    permission?.granted && state.status === "scanning" ? (
      <View style={styles.cameraWrap}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: TYPES }}
          onBarcodeScanned={({ data }) => find(data)}
        />
        <View pointerEvents="none" style={styles.frame} />
      </View>
    ) : null;

  return (
    <Screen>
      <View style={[s.row, { gap: 12 }]}>
        <IconBtn label="Back" onPress={back}>
          <ArrowLeft size={20} color={T.ink} />
        </IconBtn>
        <Serif size={22} accessibilityRole="header">
          {`Scan for ${MEAL[meal].label.toLowerCase()}`}
        </Serif>
      </View>

      <View style={{ marginTop: 18 }}>
        {camera}
        {permission && !permission.granted && state.status === "scanning" && (
          <View style={styles.card}>
            <Body size={14} color={T.ink}>
              Selena uses the camera only to read barcodes. Nothing is recorded or kept.
            </Body>
            <Pressable onPress={requestPermission} accessibilityRole="button" accessibilityLabel="Allow the camera" style={styles.primary}>
              <Text style={styles.primaryText}>Allow the camera</Text>
            </Pressable>
          </View>
        )}
        {state.status === "looking" && (
          <Body size={14} color={T.ink} testID="scan-status">{`Looking up ${state.code}…`}</Body>
        )}
        {(state.status === "missing" || state.status === "offline") && (
          <View style={styles.card} testID="scan-status">
            <Body size={14} color={T.ink}>
              {state.status === "missing"
                ? `This product isn't in the database yet (${state.code}). You can add it yourself in a minute.`
                : "The product database can't be reached right now. Check your connection and try again."}
            </Body>
            {state.status === "missing" && (
              <Pressable
                onPress={() => router.replace({ pathname: "/food/new", params: { kind: "food", meal, barcode: state.code, date } })}
                accessibilityRole="button"
                accessibilityLabel="Create this food"
                style={styles.primary}
              >
                <Text style={styles.primaryText}>Create this food</Text>
              </Pressable>
            )}
            <Pressable onPress={again} accessibilityRole="button" accessibilityLabel="Scan again" style={styles.ghost}>
              <Text style={{ fontFamily: F.sansMed, fontSize: 14.5, color: T.ink }}>Scan again</Text>
            </Pressable>
          </View>
        )}
      </View>

      <Text style={styles.or}>or type the barcode</Text>
      <View style={[s.row, { gap: 10 }]}>
        <TextInput
          value={typed}
          onChangeText={(v) => setTyped(v.replace(/\D/g, ""))}
          keyboardType="number-pad"
          placeholder="The number under the bars"
          placeholderTextColor={T.inkSoft}
          accessibilityLabel="Barcode number"
          style={styles.input}
        />
        <Pressable
          onPress={() => {
            busy.current = false;
            find(typed);
          }}
          disabled={typed.length < 8}
          accessibilityRole="button"
          accessibilityLabel="Look up barcode"
          accessibilityState={{ disabled: typed.length < 8 }}
          style={[styles.lookBtn, typed.length < 8 && { opacity: 0.45 }]}
        >
          <Text style={styles.primaryText}>Look up</Text>
        </Pressable>
      </View>

      <FoodDetail
        food={state.food}
        grams={state.food ? defaultGrams(state.food, foodLibrary.recent) : undefined}
        visible={state.status === "found"}
        hidden={hidden}
        title={MEAL[meal].label}
        confirmLabel={`Add to ${MEAL[meal].label}`}
        onClose={again}
        onConfirm={(g) => {
          addFoodEntries([foodEntry(meal, state.food, g)], date);
          back();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  cameraWrap: { height: 300, overflow: "hidden", backgroundColor: "#111" },
  frame: { position: "absolute", left: "12%", right: "12%", top: "32%", bottom: "32%", borderWidth: 2, borderColor: "rgba(242,239,230,0.85)" },
  card: { gap: 12, padding: 18, backgroundColor: T.surface, borderWidth: 1, borderColor: T.hair },
  primary: { minHeight: 50, backgroundColor: OLIVE, alignItems: "center", justifyContent: "center" },
  primaryText: { fontFamily: F.sansMed, fontSize: 15, color: T.canvas },
  ghost: { minHeight: 48, borderWidth: 1, borderColor: T.hair, alignItems: "center", justifyContent: "center" },
  or: { fontFamily: F.serifItalic, fontSize: 15, color: T.inkSoft, textAlign: "center", marginTop: 22, marginBottom: 10 },
  input: { flex: 1, minHeight: 50, paddingHorizontal: 16, borderWidth: 1, borderColor: T.hair, backgroundColor: T.surface, fontFamily: F.sans, fontSize: 15.5, color: T.ink },
  lookBtn: { minHeight: 50, paddingHorizontal: 20, backgroundColor: OLIVE, alignItems: "center", justifyContent: "center" },
});
