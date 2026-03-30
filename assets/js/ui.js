export function getDom() {
  return {
    modeButtons: [...document.querySelectorAll(".mode-button")],
    lockIndex: document.getElementById("lock-index"),
    swapSides: document.getElementById("swap-sides"),
    statusMessage: document.getElementById("status-message"),

    panels: {
      left: {
        codec: document.getElementById("left-codec"),
        bitrate: document.getElementById("left-bitrate"),
        index: document.getElementById("left-index"),
        setOriginalButton: document.querySelector('[data-panel="left"] [data-action="set-original"]'),
      },
      right: {
        codec: document.getElementById("right-codec"),
        bitrate: document.getElementById("right-bitrate"),
        index: document.getElementById("right-index"),
        setOriginalButton: document.querySelector(
          '[data-panel="right"] [data-action="set-original"]'
        ),
      },
    },

    overlayView: document.getElementById("overlay-view"),
    splitView: document.getElementById("split-view"),

    overlay: {
      stage: document.getElementById("overlay-stage"),
      baseImage: document.getElementById("overlay-base-image"),
      topImage: document.getElementById("overlay-top-image"),
      cornerBadge: document.getElementById("overlay-corner-badge"),
      visibleState: document.getElementById("overlay-visible-state"),
      baseLabel: document.getElementById("overlay-base-label"),
      topLabel: document.getElementById("overlay-top-label"),
      baseFile: document.getElementById("overlay-base-file"),
      topFile: document.getElementById("overlay-top-file"),
    },

    split: {
      stage: document.getElementById("split-stage"),
      baseImage: document.getElementById("split-base-image"),
      overlayImage: document.getElementById("split-overlay-image"),
      divider: document.getElementById("split-divider"),
      leftBadge: document.getElementById("split-left-badge"),
      rightBadge: document.getElementById("split-right-badge"),
      visibleState: document.getElementById("split-visible-state"),
      leftLabel: document.getElementById("split-left-label"),
      rightLabel: document.getElementById("split-right-label"),
      leftFile: document.getElementById("split-left-file"),
      rightFile: document.getElementById("split-right-file"),
    },
  };
}

export function setStatus(dom, message, isError = false) {
  dom.statusMessage.textContent = message;
  dom.statusMessage.classList.toggle("is-error", isError);
}

export function setSelectOptions(selectElement, values, selectedValue, labelFormatter = String) {
  const optionsMarkup = values
    .map((value) => {
      const selected = value === selectedValue ? " selected" : "";
      return `<option value="${value}"${selected}>${labelFormatter(value)}</option>`;
    })
    .join("");

  selectElement.innerHTML = optionsMarkup;
}

export function formatBitrateLabel(value) {
  return value === "source" ? "source" : value;
}

export function formatSelectionLabel(selection) {
  return `${selection.codec} | ${formatBitrateLabel(selection.bitrate)} | image ${selection.index}`;
}

export function setViewMode(dom, mode) {
  const splitEnabled = mode === "split";

  dom.overlayView.classList.toggle("is-hidden", splitEnabled);
  dom.splitView.classList.toggle("is-hidden", !splitEnabled);

  for (const button of dom.modeButtons) {
    button.classList.toggle("is-active", button.dataset.viewMode === mode);
  }
}

export function updateSplitPosition(dom, value) {
  const clamped = Math.max(0, Math.min(100, value));
  dom.split.overlayImage.style.clipPath = `inset(0 ${100 - clamped}% 0 0)`;
  dom.split.divider.style.left = `${clamped}%`;
}

export function setOverlayTopHidden(dom, hidden) {
  dom.overlay.topImage.classList.toggle("is-layer-hidden", hidden);
  dom.overlay.stage.setAttribute("aria-pressed", String(hidden));
  dom.overlay.cornerBadge.classList.toggle("is-image-a", hidden);
  dom.overlay.cornerBadge.classList.toggle("is-image-b", !hidden);
  dom.overlay.cornerBadge.textContent = hidden ? "Image A visible" : "Image B visible";

  dom.overlay.visibleState.textContent = hidden
    ? "Vue actuelle: Image A visible (Image B masquee)."
    : "Vue actuelle: Image B visible (Image A en dessous).";
}
