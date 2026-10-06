export const MAX_REFERENCE_BYTES = 20 * 1024 * 1024;
export const MAX_REFERENCE_PIXELS = 32_000_000;
const formats = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);
export function validateReferenceDimensions(width: number, height: number) {
  if (!Number.isFinite(width * height) || width <= 0 || height <= 0 || width * height > MAX_REFERENCE_PIXELS)
    throw new Error("Choose an image with positive dimensions and no more than 32 megapixels.");
}
/** SVG is decoded as an image only. Reject active and remotely resolved content before decoding. */
export function validateReferenceSvg(source: string) {
  if (/<!DOCTYPE|<!ENTITY/i.test(source)) throw new Error("SVG declarations are unsupported. Export a plain SVG or PNG.");
  const doc = new DOMParser().parseFromString(source, "image/svg+xml");
  if (doc.querySelector("parsererror") || doc.documentElement.localName !== "svg") throw new Error("This SVG could not be read. Export it again or choose a PNG.");
  for (const node of doc.querySelectorAll("*")) {
    if (["script", "foreignobject", "image", "feimage", "animate", "animatetransform", "animatemotion", "set", "iframe", "audio", "video"].includes(node.localName.toLowerCase()))
      throw new Error("This SVG contains embedded or active content. Export a plain SVG or PNG.");
    for (const attribute of Array.from(node.attributes)) {
      if (/^on/i.test(attribute.name) || attribute.name === "xml:base" || (/href$/i.test(attribute.name) && !attribute.value.startsWith("#")))
        throw new Error("This SVG contains scripts or external resources. Export a plain SVG or PNG.");
    }
  }
  const css = [...doc.querySelectorAll("style")].map(node => node.textContent).join("\n") + [...doc.querySelectorAll("*")].flatMap(node => Array.from(node.attributes, attribute => attribute.value)).join("\n");
  if (/@import|@font-face|\\|\/\*/i.test(css) || /url\(\s*["']?(?!#)/i.test(css.replace(/url\(\s*(['"])(#[^'"]+)\1\s*\)/gi, "url($2)")))
    throw new Error("This SVG uses unsupported styles or external resources. Export a plain SVG or PNG.");
  if (doc.createTreeWalker(doc, 64).nextNode()) throw new Error("SVG processing instructions are unsupported. Export a plain SVG or PNG.");
}
export async function decodeReferenceImage(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  if (file.size > MAX_REFERENCE_BYTES) throw new Error("Choose an image smaller than 20 MB.");
  const extension = file.name.split(".").at(-1)?.toLowerCase();
  const mime = file.type || ({ png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", svg: "image/svg+xml" }[extension ?? ""]);
  if (!mime || !formats.has(mime)) throw new Error("Choose a PNG, JPEG, WebP, or SVG image.");
  const blob = file.slice(0, file.size, mime);
  if (mime === "image/svg+xml") validateReferenceSvg(await blob.text());
  else {
    // Do not let a renamed SVG bypass validation through browser image sniffing.
    const header = new Uint8Array(await blob.slice(0, 12).arrayBuffer());
    const matches = mime === "image/png" ? [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => header[index] === value)
      : mime === "image/jpeg" ? header[0] === 255 && header[1] === 216 && header[2] === 255
        : String.fromCharCode(...header.slice(0, 4)) === "RIFF" && String.fromCharCode(...header.slice(8, 12)) === "WEBP";
    if (!matches) throw new Error("The image contents do not match its format. Export it again as PNG, JPEG, WebP, or SVG.");
  }
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.src = url;
    await image.decode().catch(() => { throw new Error("This image could not be read. Export it again or choose another image."); });
    validateReferenceDimensions(image.naturalWidth, image.naturalHeight);
    return { blob, width: image.naturalWidth, height: image.naturalHeight };
  } finally { URL.revokeObjectURL(url); }
}
