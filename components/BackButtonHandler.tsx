"use client";

import { useEffect } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

export function BackButtonHandler() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    // iOS does not use hardware back buttons (it uses swipe gestures)
    if (Capacitor.getPlatform() !== "android") return;

    let handle: { remove: () => Promise<void> } | undefined;

    CapacitorApp.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        CapacitorApp.exitApp();
      }
    }).then((h) => {
      handle = h;
    });

    return () => {
      handle?.remove();
    };
  }, []);

  return null;
}
