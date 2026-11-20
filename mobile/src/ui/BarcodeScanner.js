import React, { useRef } from "react";
import { View, Text, Pressable, Modal, StyleSheet } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { SafeAreaView } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { OLIVE } from "./food";
import { T, F } from "./theme";
import { Body, s } from "./kit";

/* ---------------------------------------------------------------
   BARCODE SCANNER — a camera window that reads one barcode and hands
   back its number. Nothing is recorded or kept.
   --------------------------------------------------------------- */

const TYPES = ["ean13", "ean8", "upc_a", "upc_e"];

export const BarcodeScanner = ({ visible, onScanned, onClose }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const done = useRef(false);
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose} onShow={() => (done.current = false)}>
      <SafeAreaView style={styles.page} testID="barcode-scanner">
        <View style={[s.row, { justifyContent: "space-between", marginBottom: 16 }]}>
          <Text style={styles.title}>Scan the barcode</Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close scanner" style={styles.close}>
            <X size={20} color={T.ink} />
          </Pressable>
        </View>
        {permission?.granted ? (
          <View style={styles.cameraWrap}>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: TYPES }}
              onBarcodeScanned={({ data }) => {
                if (done.current) return;
                done.current = true;
                onScanned(String(data).replace(/\D/g, ""));
              }}
            />
            <View pointerEvents="none" style={styles.frame} />
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            <Body size={14} color={T.ink}>
              Selena uses the camera only to read barcodes. Nothing is recorded or kept.
            </Body>
            <Pressable onPress={requestPermission} accessibilityRole="button" accessibilityLabel="Allow the camera" style={styles.primary}>
              <Text style={styles.primaryText}>Allow the camera</Text>
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: T.canvas, padding: 20 },
  title: { fontFamily: F.serif, fontSize: 22, color: T.ink },
  close: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: T.hair },
  cameraWrap: { height: 320, overflow: "hidden", backgroundColor: "#000" },
  frame: { position: "absolute", left: "12%", right: "12%", top: "32%", bottom: "32%", borderWidth: 2, borderColor: "#FFFFFF" },
  primary: { minHeight: 52, backgroundColor: OLIVE, alignItems: "center", justifyContent: "center" },
  primaryText: { fontFamily: F.sansMed, fontSize: 15, color: T.canvas },
});
