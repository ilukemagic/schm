import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { register, unregister } from "@tauri-apps/api/globalShortcut";
// Import compact mode CSS
import "./compact-mode.css";
// Import sonner
import { Toaster, toast } from "sonner";

// Add theme toggle button icon
import { CompactMode } from "@/components/CompactMode";
import { MainMode } from "@/components/MainMode";
import { useClipboardHistory } from "@/hooks/useClipboardHistory";
import { useFilteredHistory } from "@/hooks/useFilteredHistory";
import { useWindowManager } from "@/hooks/useWindowManager";

function App() {
  const { history } = useClipboardHistory();
  const {
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    filteredHistory,
  } = useFilteredHistory(history);

  const { isCompactMode, hideWindow, toggleAppWindow } = useWindowManager();

  // Theme management
  const { theme, setTheme, resolvedTheme } = useTheme();

  // Force button re-render state
  const [mounted, setMounted] = useState(false);

  // Add near other state definitions
  const [focusedItemIndex, setFocusedItemIndex] = useState(-1);

  // Ensure theme-related elements are rendered only after component mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Toggle theme
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Copy to clipboard
  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    // Use sonner toast
    toast.success("Copied to clipboard", {
      description: "Content has been successfully copied to your clipboard",
      duration: 2000,
    });
  };

  useEffect(() => {
    const registerShortcuts = async () => {
      // Register Ctrl+Shift+V (Windows/Linux) or Command+Shift+V (macOS) as trigger shortcut
      await register("CommandOrControl+Shift+V", () => {
        toggleAppWindow();
      });

      // Add Escape key functionality to close compact mode
      document.addEventListener("keydown", handleKeyDown);
    };

    registerShortcuts().catch(console.error);

    return () => {
      // Clean up shortcuts
      unregister("CommandOrControl+Shift+V").catch(console.error);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Modify handleKeyDown function
  const handleKeyDown = (event: KeyboardEvent) => {
    if (!isCompactMode) return;

    // Arrow key navigation
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (filteredHistory.length > 0) {
        let newIndex;
        if (event.key === "ArrowDown") {
          newIndex =
            focusedItemIndex < filteredHistory.length - 1
              ? focusedItemIndex + 1
              : 0;
        } else {
          newIndex =
            focusedItemIndex > 0
              ? focusedItemIndex - 1
              : filteredHistory.length - 1;
        }
        setFocusedItemIndex(newIndex);

        // Ensure selected item is visible
        const element = document.querySelector(`[data-index="${newIndex}"]`);
        element?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }

    // Escape key closes compact mode
    if (event.key === "Escape") {
      hideWindow();
    }

    // Enter key copies the currently selected item
    if (event.key === "Enter" && focusedItemIndex !== -1) {
      const selectedItem = filteredHistory[focusedItemIndex];
      if (selectedItem) {
        copyToClipboard(selectedItem.content);
        hideWindow();
      }
    }
  };

  // Modify keyboard event listener useEffect
  useEffect(() => {
    if (isCompactMode) {
      window.addEventListener("keydown", handleKeyDown);
      // Default selected item when opening compact mode
      if (filteredHistory.length > 0) {
        setFocusedItemIndex(0);
      }
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCompactMode, filteredHistory, focusedItemIndex]); // Add necessary dependencies

  // Modify this useEffect to set selected item only on initialization and search/tab changes
  useEffect(() => {
    // Only set selected item on initial opening or search/tab changes
    if (
      isCompactMode &&
      filteredHistory.length > 0 &&
      focusedItemIndex === -1
    ) {
      setFocusedItemIndex(0);
    } else if (!isCompactMode) {
      setFocusedItemIndex(-1);
    }
  }, [searchTerm, activeTab, isCompactMode, filteredHistory.length]);

  // Ensure correct color scheme is applied during client-side rendering
  if (!mounted) {
    // Return a basic placeholder state to avoid flashing
    return <div className="flex h-screen overflow-hidden bg-background"></div>;
  }

  return (
    <div
      className={`flex h-screen overflow-hidden bg-background ${
        isCompactMode ? "compact-mode" : ""
      }`}
    >
      <Toaster
        position="top-center"
        richColors
        theme={resolvedTheme as "light" | "dark" | undefined}
      />

      {isCompactMode ? (
        <CompactMode
          filteredHistory={filteredHistory}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onHide={hideWindow}
          theme={theme || "light"}
          onThemeToggle={toggleTheme}
        />
      ) : (
        <MainMode
          filteredHistory={filteredHistory}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          theme={theme || "light"}
          onThemeToggle={toggleTheme}
        />
      )}
    </div>
  );
}

export default App;
