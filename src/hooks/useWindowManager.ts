import { useState } from "react";
import { appWindow } from "@tauri-apps/api/window";
import { PhysicalSize } from "@tauri-apps/api/window";

export function useWindowManager() {
  const [isCompactMode, setIsCompactMode] = useState(false);

  const hideWindow = async () => {
    setIsCompactMode(false);
    await appWindow.setDecorations(true);
    await appWindow.hide();
  };

  const showWindow = async () => {
    setIsCompactMode(true);
    await appWindow.setSize(new PhysicalSize(1000, 800));
    await appWindow.center();
    await appWindow.setDecorations(false);
    await appWindow.setAlwaysOnTop(true);
    await appWindow.show();
    await appWindow.setFocus();

    // Automatically focus the search input
    setTimeout(() => {
      const searchInput = document.querySelector('input[type="text"]');
      if (searchInput) {
        (searchInput as HTMLInputElement).focus();
      }
    }, 100);
  };

  const toggleAppWindow = async () => {
    const isVisible = await appWindow.isVisible();
    if (isVisible) {
      hideWindow();
    } else {
      showWindow();
    }
  };

  return {
    isCompactMode,
    showWindow,
    hideWindow,
    toggleAppWindow,
  };
} 