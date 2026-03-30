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

  const leftEntry = catalog.find(leftSelection.codec, leftSelection.bitrate, leftSelection.index);
  const rightEntry = catalog.find(rightSelection.codec, rightSelection.bitrate, rightSelection.index);

  const leftLabel = `Image A (dessous): ${formatSelectionLabel(leftSelection)}`;
  const rightLabel = `Image B (dessus): ${formatSelectionLabel(rightSelection)}`;

  dom.overlay.baseLabel.textContent = leftLabel;
  dom.overlay.topLabel.textContent = rightLabel;
  dom.overlay.baseFile.textContent = `Image A: ${fileLabel(leftEntry)}`;
  dom.overlay.topFile.textContent = `Image B: ${fileLabel(rightEntry)}`;

  fillImage(dom.overlay.baseImage, leftEntry, leftLabel);
  fillImage(dom.overlay.topImage, rightEntry, rightLabel);

  return {
    leftEntry,
    rightEntry,
  };
}

export function renderSplit(dom, state, leftEntry, rightEntry) {
  const leftSelection = state.left;
  const rightSelection = state.right;

  dom.split.leftBadge.textContent = "Image B";
  dom.split.rightBadge.textContent = "Image A";
  dom.split.visibleState.textContent =
    "Repere: badge gauche = image B, badge droite = image A.";
  dom.split.leftLabel.textContent = `Image A: ${formatSelectionLabel(leftSelection)}`;
  dom.split.rightLabel.textContent = `Image B: ${formatSelectionLabel(rightSelection)}`;
  dom.split.leftFile.textContent = `Image A: ${fileLabel(leftEntry)}`;
  dom.split.rightFile.textContent = `Image B: ${fileLabel(rightEntry)}`;

  if (!leftEntry || !rightEntry) {
    dom.split.baseImage.removeAttribute("src");
    dom.split.overlayImage.removeAttribute("src");
    dom.split.baseImage.alt = "Image de base indisponible";
    dom.split.overlayImage.alt = "Image overlay indisponible";
    return;
  }

  dom.split.baseImage.src = leftEntry.src;
  dom.split.baseImage.alt = dom.split.leftLabel.textContent;
  dom.split.overlayImage.src = rightEntry.src;
  dom.split.overlayImage.alt = dom.split.rightLabel.textContent;
}
