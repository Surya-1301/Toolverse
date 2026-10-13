"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { StatusBar } from "@capacitor/status-bar";

export function StatusBarHandler() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const hide = () => {
      StatusBar.hide().catch(() => {
        // Plugin unavailable — status bar stays visible.
      });
    };

    hide();

    let handle: { remove: () => Promise<void> } | undefined;
    CapacitorApp.addListener("resume", hide).then((h) => {
      handle = h;
    });

    return () => {
      handle?.remove();
    };
  }, []);

  return null;
}
