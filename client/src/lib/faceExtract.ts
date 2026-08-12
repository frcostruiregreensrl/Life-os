import * as faceapi from "face-api.js";

export interface FaceProfile {
  skinColor: string;
  hairColor: string;
  /** face bounding-box width/height, clamped — drives head shape (narrow vs round) */
  faceWidthRatio: number;
}

let modelsLoaded: Promise<void> | null = null;

function loadModels() {
  if (!modelsLoaded) {
    modelsLoaded = Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
      faceapi.nets.faceLandmark68TinyNet.loadFromUri("/models"),
    ]).then(() => undefined);
  }
  return modelsLoaded;
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

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
}

function averageColor(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): string | null {
  const { data } = ctx.getImageData(Math.max(0, Math.round(x)), Math.max(0, Math.round(y)), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let i = 0; i < data.length; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    n++;
  }
  if (n === 0) return null;
  return rgbToHex(r / n, g / n, b / n);
}

/**
 * Detects the face in a photo and derives a stylized, personalized profile from it —
 * skin tone, hair color and face proportions. Runs entirely on-device (tensorflow.js in
 * the browser, model weights self-hosted in /models): the photo is never uploaded or saved.
 * Returns null if no face is confidently detected.
 */
export async function extractFaceProfile(file: File): Promise<FaceProfile | null> {
  await loadModels();
  const img = await loadImage(file);

  const detection = await faceapi
    .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.4 }))
    .withFaceLandmarks(true);

  if (!detection) return null;

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const box = detection.detection.box;

  // cheek patch: below the eyes, beside the nose — reliably skin, avoids eyes/mouth/hair
  const skinColor =
    averageColor(ctx, box.x + box.width * 0.16, box.y + box.height * 0.52, box.width * 0.16, box.height * 0.14) ||
    "#c99a72";

  // strip just above the detected face box — catches hair/hairline color
  const hairColor =
    averageColor(ctx, box.x + box.width * 0.2, Math.max(0, box.y - box.height * 0.22), box.width * 0.6, box.height * 0.16) ||
    "#3a2c22";

  const faceWidthRatio = Math.min(1.15, Math.max(0.7, box.width / box.height));

  return { skinColor, hairColor, faceWidthRatio };
}
