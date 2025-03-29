import { useState, useEffect } from 'react';
import { ClipboardEvent } from '@/types';

export function useKeyboardNavigation(
  isCompactMode: boolean,
  filteredHistory: ClipboardEvent[],
  onCopy: (content: string) => void,
  onHide: () => void
) {
  const [focusedItemIndex, setFocusedItemIndex] = useState(-1);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isCompactMode) return;

      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (filteredHistory.length > 0) {
          let newIndex;
          if (event.key === "ArrowDown") {
            newIndex = focusedItemIndex < filteredHistory.length - 1 ? focusedItemIndex + 1 : 0;
          } else {
            newIndex = focusedItemIndex > 0 ? focusedItemIndex - 1 : filteredHistory.length - 1;
          }
          setFocusedItemIndex(newIndex);

          const element = document.querySelector(`[data-index="${newIndex}"]`);
          element?.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
      }

      if (event.key === "Escape") {
        onHide();
      }

      if (event.key === "Enter" && focusedItemIndex !== -1) {
        const selectedItem = filteredHistory[focusedItemIndex];
        if (selectedItem) {
          onCopy(selectedItem.content);
          onHide();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCompactMode, filteredHistory, focusedItemIndex, onCopy, onHide]);

  return { focusedItemIndex, setFocusedItemIndex };
} 