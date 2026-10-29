/* WCAG 2.x contrast maths, with alpha compositing for translucent text. */

const parse = (color) => {
  const hex = color.match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return { r: n >> 16, g: (n >> 8) & 255, b: n & 255, a: 1 };
  }
  const rgba = color.match(/^rgba?\(([^)]+)\)$/i);
  if (rgba) {
    const [r, g, b, a = 1] = rgba[1].split(",").map((v) => parseFloat(v));
    return { r, g, b, a };
  }
  throw new Error(`Unsupported colour: ${color}`);
};

/** Flatten a possibly translucent colour onto an opaque background. */
export const composite = (fg, bg) => {
  const f = parse(fg);
  const b = parse(bg);
  const mix = (x, y) => Math.round(x * f.a + y * (1 - f.a));
  return { r: mix(f.r, b.r), g: mix(f.g, b.g), b: mix(f.b, b.b), a: 1 };
};

const channel = (c) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

export const luminance = ({ r, g, b }) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);

export const contrastRatio = (fg, bg) => {
  const back = parse(bg);
  const front = composite(fg, bg);
  const [hi, lo] = [luminance(front), luminance(back)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** 4.5:1 for body text, 3:1 for large text (24px and up). */
export const meetsAA = (fg, bg, { largeText = false } = {}) => contrastRatio(fg, bg) >= (largeText ? 3 : 4.5);
