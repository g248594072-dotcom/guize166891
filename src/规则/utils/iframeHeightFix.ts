export type IframeHeightFixOptions = {
  minHeightPx: number; // Minimum height to keep (px)
  selector: string; // iframe selector in parent document
  intervalMs: number; // Poll interval
};

const DEFAULTS: IframeHeightFixOptions = {
  minHeightPx: 600,
  selector: 'iframe[id^="TH-message--"]',
  intervalMs: 200,
};

function safeSetIframeMinHeight(
  parentDoc: Document,
  options: IframeHeightFixOptions,
) {
  const HEIGHT = `${options.minHeightPx}px`;
  const iframes = parentDoc.querySelectorAll<HTMLIFrameElement>(options.selector);
  if (iframes.length === 0) return;

  for (const iframe of Array.from(iframes)) {
    // Keep a minimum height, but don't force a fixed height.
    iframe.style.setProperty('min-height', HEIGHT, 'important');
    iframe.style.setProperty('max-height', 'none', 'important');
    // If we previously forced a fixed height, remove it so larger sizes can work.
    iframe.style.removeProperty('height');
  }
}

/**
 * Keep host iframe from shrinking into a narrow strip.
 * This code runs inside the iframe, but modifies `window.parent.document`.
 *
 * If parent is cross-origin, it will silently no-op.
 */
export function startIframeHeightFix(
  opts?: Partial<IframeHeightFixOptions>,
): () => void {
  const options: IframeHeightFixOptions = { ...DEFAULTS, ...(opts ?? {}) };

  // If already started in the same iframe instance, disconnect first.
  if ((window as any).__thHeightFixIntervalId) {
    clearInterval((window as any).__thHeightFixIntervalId);
    (window as any).__thHeightFixIntervalId = null;
  }

  const parentWin = window.parent;
  let parentDoc: Document | null = null;
  try {
    parentDoc = parentWin?.document ?? null;
  } catch {
    parentDoc = null;
  }

  if (!parentDoc) return () => {};

  const enforce = () => {
    try {
      safeSetIframeMinHeight(parentDoc!, options);
    } catch {
      // Ignore (host may re-render and detach nodes)
    }
  };

  // Poll because host writes styles repeatedly after "confirm".
  enforce();
  const intervalId = window.setInterval(enforce, options.intervalMs);
  (window as any).__thHeightFixIntervalId = intervalId;

  return () => {
    try {
      clearInterval(intervalId);
    } finally {
      if ((window as any).__thHeightFixIntervalId === intervalId) {
        (window as any).__thHeightFixIntervalId = null;
      }
    }
  };
}

