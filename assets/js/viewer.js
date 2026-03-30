import { formatSelectionLabel } from "./ui.js";

function fillImage(target, entry, labelText) {
  if (!entry) {
    target.removeAttribute("src");
    target.alt = `${labelText} indisponible`;
    return;
  }

  target.src = entry.src;
  target.alt = labelText;
}

function fileLabel(entry) {
  return entry ? entry.filename : "Image introuvable.";
}

export function renderOverlay(dom, state, catalog) {
  const leftSelection = state.left;
  const rightSelection = state.right;

  const leftEntry = catalog.find(
    leftSelection.codec,
    leftSelection.bitrate,
    leftSelection.index,
  );
  const rightEntry = catalog.find(
    rightSelection.codec,
    rightSelection.bitrate,
    rightSelection.index,
  );

  const leftLabel = `Image A (dessus): ${formatSelectionLabel(leftSelection)}`;
  const rightLabel = `Image B (dessous): ${formatSelectionLabel(rightSelection)}`;

  dom.overlay.baseLabel.textContent = leftLabel;
  dom.overlay.topLabel.textContent = rightLabel;

  fillImage(dom.overlay.baseImage, rightEntry, rightLabel);
  fillImage(dom.overlay.topImage, leftEntry, leftLabel);

  return {
    leftEntry,
    rightEntry,
  };
}

export function renderSplit(dom, state, leftEntry, rightEntry) {
  const leftSelection = state.left;
  const rightSelection = state.right;

  dom.split.leftBadge.textContent = "Image A";
  dom.split.rightBadge.textContent = "Image B";
  dom.split.visibleState.textContent =
    "Repere: badge gauche = image A, badge droite = image B.";
  dom.split.leftLabel.textContent = `Image A: ${formatSelectionLabel(leftSelection)}`;
  dom.split.rightLabel.textContent = `Image B: ${formatSelectionLabel(rightSelection)}`;

  if (!leftEntry || !rightEntry) {
    dom.split.baseImage.removeAttribute("src");
    dom.split.overlayImage.removeAttribute("src");
    dom.split.baseImage.alt = "Image de base indisponible";
    dom.split.overlayImage.alt = "Image overlay indisponible";
    return;
  }

  dom.split.baseImage.src = rightEntry.src;
  dom.split.baseImage.alt = dom.split.rightLabel.textContent;
  dom.split.overlayImage.src = leftEntry.src;
  dom.split.overlayImage.alt = dom.split.leftLabel.textContent;
}
