import {PluginCommAPI, PluginManager, PluginNoteAPI} from 'sn-plugin-lib';

type ApiResult<T> = {success?: boolean; result?: T | null; error?: {code?: number; message?: string} | null} | null | undefined;
type Size = {width: number; height: number};
type Rect = {left: number; top: number; right: number; bottom: number};
type LassoElement = {
  type: number;
  maxX?: number;
  maxY?: number;
  recycle?: () => Promise<void>;
  [key: string]: unknown;
};

const DEFAULT_PAGE: Size = {width: 1404, height: 1872};
const CORNER_METHOD_PAGE: Size = {width: 1920, height: 2560};

export async function pageSize(): Promise<Size> {
  try {
    const r = (await PluginCommAPI.getPageDisplaySize()) as ApiResult<Size>;
    if (r?.success && r.result?.width && r.result?.height) {
      return {width: Math.round(r.result.width), height: Math.round(r.result.height)};
    }
  } catch {}
  return DEFAULT_PAGE;
}

function isWideEmrSelection(elements: LassoElement[]): boolean {
  return elements.some(el => Number(el.maxX) > 18000 || Number(el.maxY) > 14000);
}

function addUniqueSize(sizes: Size[], seen: Set<string>, width: unknown, height: unknown): void {
  const w = Math.round(Number(width) || 0);
  const h = Math.round(Number(height) || 0);
  if (w < 100 || h < 100 || w > 50000 || h > 50000) return;
  const key = `${w}x${h}`;
  if (!seen.has(key)) {
    seen.add(key);
    sizes.push({width: w, height: h});
  }
}

function scanMetadataForSizes(value: unknown, base: Size, sizes: Size[], seen: Set<string>, depth = 0): void {
  if (!value || typeof value !== 'object' || depth > 4) return;
  const o = value as Record<string, unknown>;

  const pageWidth = o.pixel_width ?? o.pixelWidth ?? o.pageWidth ?? o.page_width;
  const pageHeight = o.pixel_height ?? o.pixelHeight ?? o.pageHeight ?? o.page_height;
  if (pageWidth && pageHeight) addUniqueSize(sizes, seen, pageWidth, pageHeight);

  const maxX = o.maxX ?? o.max_x ?? o.screen_width ?? o.screenWidth;
  const maxY = o.maxY ?? o.max_y ?? o.screen_height ?? o.screenHeight;
  if (maxX && maxY) {
    addUniqueSize(sizes, seen, maxX, maxY);
    addUniqueSize(sizes, seen, maxY, maxX);

    const sx = Number(maxX) / base.width;
    const sy = Number(maxY) / base.height;
    if (sx > 2 && sy > 2) {
      const scale = (sx + sy) / 2;
      addUniqueSize(sizes, seen, Number(maxX) / scale, Number(maxY) / scale);
    }
  }

  if (depth < 2) {
    for (const child of Object.values(o)) {
      if (child && typeof child === 'object') scanMetadataForSizes(child, base, sizes, seen, depth + 1);
    }
  }
}

/**
 * Supernote Corner Method
 *
 * Some A5X devices report a 1404x1872 display/page while lasso stroke metadata
 * uses the newer EMR coordinate range (roughly maxX=20967, maxY=15725).
 * Passing 1404x1872 to recognizeElements can fail for handwriting near the
 * lower corners. When that EMR range is detected, try 1920x2560 first.
 */
export async function recognizeCurrentLasso(): Promise<{text: string; rect: Rect}> {
  let elements: LassoElement[] = [];
  try {
    const r = (await PluginCommAPI.getLassoElements()) as ApiResult<LassoElement[]>;
    elements = r?.success && Array.isArray(r.result) ? r.result : [];
    const strokes = elements.filter(e => e.type === 0);
    if (!strokes.length) throw new Error('Lasso a handwritten stock ticker, such as AAPL.');

    const base = await pageSize();
    const sizes: Size[] = [];
    const seen = new Set<string>();

    if (isWideEmrSelection(strokes)) {
      addUniqueSize(sizes, seen, CORNER_METHOD_PAGE.width, CORNER_METHOD_PAGE.height);
    }
    addUniqueSize(sizes, seen, base.width, base.height);
    for (const stroke of strokes) scanMetadataForSizes(stroke, base, sizes, seen);

    let recognized: ApiResult<string> = null;
    for (const size of sizes) {
      recognized = (await PluginCommAPI.recognizeElements(strokes, size)) as ApiResult<string>;
      if (recognized?.success && typeof recognized.result === 'string' && recognized.result.trim()) break;
    }

    const rect = (await PluginCommAPI.getLassoRect()) as ApiResult<Rect>;
    if (!recognized?.success || typeof recognized.result !== 'string') {
      throw new Error(recognized?.error?.message || "Supernote couldn't recognize that selection.");
    }
    if (!rect?.success || !rect.result) throw new Error("Couldn't read the lasso position.");

    const text = recognized.result.trim();
    if (!text) throw new Error('Recognition failed. Please try again!');
    return {text, rect: rect.result};
  } finally {
    for (const el of elements) el.recycle?.().catch(() => {});
  }
}

async function insertText(call: () => Promise<unknown>): Promise<void> {
  const r = (await call()) as ApiResult<boolean>;
  if (!r?.success || r.result !== true) throw new Error(r?.error?.message || 'The note did not accept the quote text.');
}

export async function insertQuoteText(text: string, lassoRect?: Rect): Promise<void> {
  const page = await pageSize();
  const margin = Math.round(page.width * 0.06);
  const width = page.width - margin * 2;
  const top = Math.max(margin, Math.min(Math.round(lassoRect?.bottom ?? margin), page.height - 300));
  const textRect = {left: margin, top, right: margin + width, bottom: Math.min(page.height - margin, top + 220)};
  const fields = {
    textContentFull: text,
    textRect,
    fontSize: 38,
    textAlign: 0,
    textBold: 0,
    textItalics: 0,
    textFrameWidthType: 0,
    textFrameStyle: 0,
    textEditable: 0,
  };
  await insertText(() => PluginNoteAPI.insertText(fields));
}

export function closePanel(): void {
  try { PluginManager.closePluginView().catch(() => {}); } catch {}
}
