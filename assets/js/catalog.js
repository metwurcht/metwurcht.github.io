const FILE_PATTERN = /^deepsea-(AV1|x265|ORIGINAL)-([0-9]+kbps|source)-([1-8])\.png$/;
const CODEC_ORDER = ["ORIGINAL", "AV1", "x265"];

function codecWeight(codec) {
  const index = CODEC_ORDER.indexOf(codec);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function bitrateWeight(bitrate) {
  if (bitrate === "source") {
    return -1;
  }

  const numeric = Number.parseInt(bitrate, 10);
  return Number.isNaN(numeric) ? Number.MAX_SAFE_INTEGER : numeric;
}

function parseFilename(filename) {
  const match = filename.match(FILE_PATTERN);
  if (!match) {
    return null;
  }

  return {
    filename,
    codec: match[1],
    bitrate: match[2],
    index: Number.parseInt(match[3], 10),
    src: `images/${filename}`,
  };
}

function extractFilenamesFromTree(treeText) {
  const filenames = [];
  const lines = treeText.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const match = line.match(/(deepsea-(?:AV1|x265|ORIGINAL)-(?:[0-9]+kbps|source)-[1-8]\.png)$/);
    if (match) {
      filenames.push(match[1]);
    }
  }

  return filenames;
}

export async function loadCatalog(treeFilePath = "tree.txt") {
  const response = await fetch(treeFilePath, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Impossible de charger ${treeFilePath} (${response.status}).`);
  }

  const treeText = await response.text();
  const filenames = extractFilenamesFromTree(treeText);

  if (filenames.length === 0) {
    throw new Error("Aucune image compatible trouvee dans tree.txt.");
  }

  return buildCatalog(filenames);
}

export function buildCatalog(filenames) {
  const entries = [];
  const entryByKey = new Map();
  const bitratesByCodec = new Map();
  const indexesByCodecBitrate = new Map();

  for (const filename of new Set(filenames)) {
    const entry = parseFilename(filename);
    if (!entry) {
      continue;
    }

    entries.push(entry);
    entryByKey.set(`${entry.codec}|${entry.bitrate}|${entry.index}`, entry);

    if (!bitratesByCodec.has(entry.codec)) {
      bitratesByCodec.set(entry.codec, new Set());
    }
    bitratesByCodec.get(entry.codec).add(entry.bitrate);

    const pairKey = `${entry.codec}|${entry.bitrate}`;
    if (!indexesByCodecBitrate.has(pairKey)) {
      indexesByCodecBitrate.set(pairKey, new Set());
    }
    indexesByCodecBitrate.get(pairKey).add(entry.index);
  }

  const codecs = [...bitratesByCodec.keys()].sort((a, b) => codecWeight(a) - codecWeight(b));

  const preparedBitratesByCodec = new Map();
  for (const [codec, bitrateSet] of bitratesByCodec.entries()) {
    preparedBitratesByCodec.set(
      codec,
      [...bitrateSet].sort((a, b) => bitrateWeight(a) - bitrateWeight(b))
    );
  }

  const preparedIndexesByPair = new Map();
  for (const [pairKey, indexSet] of indexesByCodecBitrate.entries()) {
    preparedIndexesByPair.set(
      pairKey,
      [...indexSet].sort((a, b) => a - b)
    );
  }

  entries.sort((a, b) => {
    const codecDiff = codecWeight(a.codec) - codecWeight(b.codec);
    if (codecDiff !== 0) {
      return codecDiff;
    }

    const bitrateDiff = bitrateWeight(a.bitrate) - bitrateWeight(b.bitrate);
    if (bitrateDiff !== 0) {
      return bitrateDiff;
    }

    return a.index - b.index;
  });

  return {
    entries,
    codecs,
    total: entries.length,

    getBitrates(codec) {
      return preparedBitratesByCodec.get(codec) ?? [];
    },

    getIndexes(codec, bitrate) {
      return preparedIndexesByPair.get(`${codec}|${bitrate}`) ?? [];
    },

    find(codec, bitrate, index) {
      return entryByKey.get(`${codec}|${bitrate}|${index}`) ?? null;
    },

    hasCodec(codec) {
      return preparedBitratesByCodec.has(codec);
    },
  };
}
