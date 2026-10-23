"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { StatusBar, Style } from "@capacitor/status-bar";

export function StatusBarHandler() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const configureStatusBar = async () => {
      try {
        if (Capacitor.getPlatform() === "ios") {
          await StatusBar.setStyle({ style: Style.Dark });
          await StatusBar.show();
        } else {
          await StatusBar.hide();
        }
      } catch {
        // Plugin unavailable — status bar stays visible.
      }
    };

    configureStatusBar();

    let handle: { remove: () => Promise<void> } | undefined;
    CapacitorApp.addListener("resume", configureStatusBar).then((h) => {
      handle = h;
    });

    return () => {
      handle?.remove();
    };
  }, []);

  return null;
}
