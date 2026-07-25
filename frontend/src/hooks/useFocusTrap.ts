import { useEffect, useRef } from "react";

export function useFocusTrap(isActive: boolean, onClose?: () => void) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) return;
    const el = ref.current;
    if (!el) return;
    
    // Save previous active element
    const previousFocus = document.activeElement as HTMLElement;

    const focusableElements = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (firstElement) {
      firstElement.focus();
    }

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
        e.preventDefault();
        return;
      }

      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    el.addEventListener('keydown', handleKey);
    return () => {
      el.removeEventListener('keydown', handleKey);
      // Restore focus on close
      previousFocus?.focus();
    };
  }, [isActive]);

  return ref;
}
