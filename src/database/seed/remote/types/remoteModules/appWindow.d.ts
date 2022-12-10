import type { DOMWindow } from 'jsdom';

declare global {
  interface Window extends Window, DOMWindow {
    appWindow: Window;
  }
}
