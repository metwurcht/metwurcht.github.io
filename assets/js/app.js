import { loadCatalog } from "./catalog.js";
import {
  formatBitrateLabel,
  formatSelectionLabel,
  getDom,
  setSelectOptions,
  setOverlayTopHidden,
  setStatus,
  setViewMode,
  updateSplitPosition,
} from "./ui.js";
import { renderOverlay, renderSplit } from "./viewer.js";

const PANEL_NAMES = ["left", "right"];

let dom;
let catalog;
let state;

function chooseNearestIndex(indexes, target) {
  if (!indexes.length) {
    return 1;
  }

  let nearest = indexes[0];
  let bestDistance = Math.abs(nearest - target);

  for (const candidate of indexes) {
    const distance = Math.abs(candidate - target);
    if (distance < bestDistance) {
      nearest = candidate;
      bestDistance = distance;
    }
  }

  return nearest;
}

function pickPreferredBitrate(codec, preferredValue) {
  const bitrates = catalog.getBitrates(codec);
  if (!bitrates.length) {
    return "";
  }

  if (preferredValue && bitrates.includes(preferredValue)) {
    return preferredValue;
  }

  if (bitrates.includes("1400kbps")) {
    return "1400kbps";
  }

  return bitrates[0];
}

function createInitialState() {
  const leftCodec = catalog.hasCodec("ORIGINAL")
    ? "ORIGINAL"
    : catalog.codecs[0];
  const rightCodec = catalog.hasCodec("AV1")
    ? "AV1"
    : catalog.hasCodec("x265")
      ? "x265"
      : leftCodec;

  const leftBitrate = pickPreferredBitrate(leftCodec, "source");
  const rightBitrate = pickPreferredBitrate(rightCodec, "1400kbps");

  const leftIndexes = catalog.getIndexes(leftCodec, leftBitrate);
  const leftIndex = leftIndexes.includes(1) ? 1 : (leftIndexes[0] ?? 1);

  const rightIndexes = catalog.getIndexes(rightCodec, rightBitrate);
  const rightIndex = rightIndexes.includes(leftIndex)
    ? leftIndex
    : chooseNearestIndex(rightIndexes, leftIndex);

  return {
    viewMode: "overlay",
    lockIndex: true,
    splitPosition: 50,
    overlayTopHidden: false,
    left: {
      codec: leftCodec,
      bitrate: leftBitrate,
      index: leftIndex,
    },
    right: {
      codec: rightCodec,
      bitrate: rightBitrate,
      index: rightIndex,
    },
  };
}

function normalizePanel(panelName) {
  const panelState = state[panelName];

  if (!catalog.hasCodec(panelState.codec)) {
    panelState.codec = catalog.codecs[0];
  }

  const bitrates = catalog.getBitrates(panelState.codec);
  if (!bitrates.includes(panelState.bitrate)) {
    panelState.bitrate = bitrates[0] ?? "";
  }

  const indexes = catalog.getIndexes(panelState.codec, panelState.bitrate);
  if (!indexes.includes(panelState.index)) {
    panelState.index = indexes[0] ?? 1;
  }
}

function syncOtherPanelIndex(sourcePanelName, targetIndex) {
  if (!state.lockIndex) {
    return;
  }

  const otherPanelName = sourcePanelName === "left" ? "right" : "left";
  const otherState = state[otherPanelName];
  const indexes = catalog.getIndexes(otherState.codec, otherState.bitrate);

  otherState.index = indexes.includes(targetIndex)
    ? targetIndex
    : chooseNearestIndex(indexes, targetIndex);
}

function refreshPanelControls(panelName) {
  const panelDom = dom.panels[panelName];
  const panelState = state[panelName];

  setSelectOptions(
    panelDom.codec,
    catalog.codecs,
    panelState.codec,
    (value) => value,
  );

  const bitrates = catalog.getBitrates(panelState.codec);
  setSelectOptions(
    panelDom.bitrate,
    bitrates,
    panelState.bitrate,
    formatBitrateLabel,
  );

  const indexes = catalog.getIndexes(panelState.codec, panelState.bitrate);
  setSelectOptions(panelDom.index, indexes, panelState.index, (value) =>
    String(value),
  );
}

function render() {
  for (const panelName of PANEL_NAMES) {
    normalizePanel(panelName);
  }

  for (const panelName of PANEL_NAMES) {
    refreshPanelControls(panelName);
  }

  const { leftEntry, rightEntry } = renderOverlay(dom, state, catalog);
  renderSplit(dom, state, leftEntry, rightEntry);

  setViewMode(dom, state.viewMode);
  setOverlayTopHidden(dom, state.overlayTopHidden);
  updateSplitPosition(dom, state.splitPosition);

  setStatus(
    dom,
    `${catalog.total} images chargees | A: ${formatSelectionLabel(state.left)} | B: ${formatSelectionLabel(state.right)}`,
  );
}

function setPanelToOriginal(panelName) {
  if (!catalog.hasCodec("ORIGINAL")) {
    return;
  }

  const panelState = state[panelName];
  panelState.codec = "ORIGINAL";
  panelState.bitrate = pickPreferredBitrate("ORIGINAL", "source");

  normalizePanel(panelName);
  syncOtherPanelIndex(panelName, panelState.index);
  render();
}

function handleCodecChange(panelName, codecValue) {
  state[panelName].codec = codecValue;
  normalizePanel(panelName);

  syncOtherPanelIndex(panelName, state[panelName].index);
  render();
}

function handleBitrateChange(panelName, bitrateValue) {
  state[panelName].bitrate = bitrateValue;
  normalizePanel(panelName);

  syncOtherPanelIndex(panelName, state[panelName].index);
  render();
}

function handleIndexChange(panelName, indexValue) {
  state[panelName].index = Number.parseInt(indexValue, 10);
  normalizePanel(panelName);

  syncOtherPanelIndex(panelName, state[panelName].index);
  render();
}

function wirePanelEvents(panelName) {
  const panelDom = dom.panels[panelName];

  panelDom.codec.addEventListener("change", (event) => {
    handleCodecChange(panelName, event.target.value);
  });

  panelDom.bitrate.addEventListener("change", (event) => {
    handleBitrateChange(panelName, event.target.value);
  });

  panelDom.index.addEventListener("change", (event) => {
    handleIndexChange(panelName, event.target.value);
  });

  panelDom.setOriginalButton.addEventListener("click", () => {
    setPanelToOriginal(panelName);
  });
}

function wireGlobalEvents() {
  for (const button of dom.modeButtons) {
    button.addEventListener("click", () => {
      state.viewMode = button.dataset.viewMode;
      render();
    });
  }

  dom.lockIndex.addEventListener("change", (event) => {
    state.lockIndex = event.target.checked;
    if (state.lockIndex) {
      syncOtherPanelIndex("left", state.left.index);
      render();
    }
  });

  dom.swapSides.addEventListener("click", () => {
    const previousLeft = { ...state.left };
    state.left = { ...state.right };
    state.right = previousLeft;
    render();
  });

  dom.overlay.stage.addEventListener("click", () => {
    state.overlayTopHidden = !state.overlayTopHidden;
    setOverlayTopHidden(dom, state.overlayTopHidden);
  });

  dom.overlay.stage.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    state.overlayTopHidden = !state.overlayTopHidden;
    setOverlayTopHidden(dom, state.overlayTopHidden);
  });

  let isDraggingSplit = false;

  const updateSplitFromPointer = (event) => {
    const rect = dom.split.stage.getBoundingClientRect();
    if (rect.width <= 0) {
      return;
    }

    const rawPercent = ((event.clientX - rect.left) / rect.width) * 100;
    state.splitPosition = Math.max(0, Math.min(100, rawPercent));
    updateSplitPosition(dom, state.splitPosition);
  };

  dom.split.stage.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    event.preventDefault();
    isDraggingSplit = true;
    dom.split.stage.setPointerCapture?.(event.pointerId);
    updateSplitFromPointer(event);
  });

  dom.split.stage.addEventListener("pointermove", (event) => {
    if (!isDraggingSplit) {
      return;
    }

    event.preventDefault();
    updateSplitFromPointer(event);
  });

  const stopSplitDrag = (event) => {
    if (!isDraggingSplit) {
      return;
    }

    isDraggingSplit = false;

    if (dom.split.stage.hasPointerCapture?.(event.pointerId)) {
      dom.split.stage.releasePointerCapture?.(event.pointerId);
    }
  };

  dom.split.stage.addEventListener("pointerup", stopSplitDrag);
  dom.split.stage.addEventListener("pointercancel", stopSplitDrag);

  dom.split.stage.addEventListener("dragstart", (event) => {
    event.preventDefault();
  });
}

function disableInputs() {
  const interactiveElements = document.querySelectorAll(
    "button, select, input",
  );
  for (const element of interactiveElements) {
    element.disabled = true;
  }
}

async function bootstrap() {
  dom = getDom();

  try {
    catalog = await loadCatalog("tree.txt");
    state = createInitialState();

    wireGlobalEvents();
    for (const panelName of PANEL_NAMES) {
      wirePanelEvents(panelName);
    }

    render();
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erreur inconnue lors du chargement du catalogue.";

    setStatus(
      dom,
      `${message} Lance un serveur local pour autoriser fetch(tree.txt).`,
      true,
    );
    disableInputs();
  }
}

bootstrap();
