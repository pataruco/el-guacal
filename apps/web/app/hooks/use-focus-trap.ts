import { type RefObject, useEffect } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  isActive: boolean,
) {
  useEffect(() => {
    const element = ref.current;
    if (!isActive || !element) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusableElements = () =>
      Array.from(element.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusable = focusableElements();
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    // Focus first element
    const focusable = focusableElements();
    if (focusable.length > 0) {
      focusable[0].focus();
    }

    element.addEventListener('keydown', handleKeyDown);

    return () => {
      element.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [ref, isActive]);
}
