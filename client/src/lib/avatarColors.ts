const SAMPLE_SIZE = 48;
const BUCKET_STEP = 24;

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Impossibile leggere l'immagine"));
    };
    img.src = url;
  });
}

/**
 * Extracts the most frequent colors from a photo, entirely in the browser.
 * The image is never uploaded anywhere — it's decoded into a canvas, sampled, and discarded.
 */
export async function extractPalette(file: File, count = 5): Promise<string[]> {
  const img = await loadImage(file);
  const canvas = document.createElement("canvas");
  canvas.width = SAMPLE_SIZE;
  canvas.height = SAMPLE_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return [];

  ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
  const { data } = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);

  const buckets = new Map<string, { r: number; g: number; b: number; n: number }>();

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const alpha = data[i + 3];
    if (alpha < 200) continue;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const isNearWhite = min > 225;
    const isNearBlack = max < 25;
    const isGray = max - min < 12;
    if (isNearWhite || isNearBlack || isGray) continue;

    const key = `${Math.round(r / BUCKET_STEP)}-${Math.round(g / BUCKET_STEP)}-${Math.round(b / BUCKET_STEP)}`;
    const existing = buckets.get(key);
    if (existing) {
      existing.r += r;
      existing.g += g;
      existing.b += b;
      existing.n += 1;
    } else {
      buckets.set(key, { r, g, b, n: 1 });
    }
  }

  const sorted = Array.from(buckets.values()).sort((a, b) => b.n - a.n);
  return sorted.slice(0, count).map((c) => rgbToHex(Math.round(c.r / c.n), Math.round(c.g / c.n), Math.round(c.b / c.n)));
}
