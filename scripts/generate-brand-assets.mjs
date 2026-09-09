import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { createElement as h } from "react";
import { ImageResponse } from "next/og.js";
import sharp from 'sharp';
import { assetUrl } from '../src/lib/cdn.ts';
import { uploadAsset, closeStorage } from './cdn-storage.ts';

async function readImage(path) {
  const response = await fetch(assetUrl(path), { redirect: 'error', signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`CDN image could not be read: ${path}`);
  return sharp(Buffer.from(await response.arrayBuffer())).png().toBuffer();
}

const root = fileURLToPath(new URL("../", import.meta.url));
const [bold, regular, chinese, avatar, cover] = await Promise.all([
  readFile(join(root, "node_modules/geist/dist/fonts/geist-sans/Geist-Bold.ttf")),
  readFile(join(root, "node_modules/geist/dist/fonts/geist-sans/Geist-Regular.ttf")),
  readFile(join(root, "assets/fonts/noto-sans-sc-subset.ttf")),
  readImage('images/avatar.png'),
  readImage('images/articles/bybit-eu/2026-09-08_bybit_eu_cover_2000x800.png'),
]);
const fonts = [
  { name: "Geist", data: bold, weight: 700, style: "normal" },
  { name: "Geist", data: regular, weight: 400, style: "normal" },
  { name: "Noto Sans SC", data: chinese, weight: 600, style: "normal" },
];
const png = (buffer) => `data:image/png;base64,${buffer.toString("base64")}`;
const colors = { ink: "#101214", paper: "#f4f6f8", accent: "#19d3c5", secondary: "#435360" };

async function render(element, width, height) {
  const response = new ImageResponse(element, { width, height, fonts });
  return Buffer.from(await response.arrayBuffer());
}

async function save(path, data) {
  await uploadAsset(path, data);
}

function wordmark(size) {
  return h("div", { style: { display: "flex", alignItems: "baseline", fontFamily: "Geist", fontSize: size, fontWeight: 700, letterSpacing: -size * 0.06, lineHeight: 1 } }, "Mason", h("span", { style: { color: colors.accent } }, "."));
}

function icon(size) {
  return h("div", { style: { width: "100%", height: "100%", background: colors.ink, color: colors.paper, display: "flex", alignItems: "center", justifyContent: "center", paddingBottom: size * 0.025 } },
    h("div", { style: { display: "flex", alignItems: "baseline", fontFamily: "Geist", fontSize: size * 0.73, fontWeight: 700, letterSpacing: -size * 0.055, lineHeight: 1 } }, "M", h("span", { style: { color: colors.accent } }, ".")));
}

const iconBuffers = new Map();
for (const size of [16, 32, 48, 180, 192, 512]) iconBuffers.set(size, await render(icon(size), size, size));
await save('icon.png', iconBuffers.get(48));
await save('apple-icon.png', iconBuffers.get(180));
await save('icons/icon-192.png', iconBuffers.get(192));
await save('icons/icon-512.png', iconBuffers.get(512));

// ICO directory entries reference full PNG payloads, retaining each native pixel size.
const sizes = [16, 32, 48];
const directory = Buffer.alloc(6 + 16 * sizes.length);
directory.writeUInt16LE(1, 2);
directory.writeUInt16LE(sizes.length, 4);
let offset = directory.length;
sizes.forEach((size, i) => {
  const entry = 6 + 16 * i;
  directory[entry] = size;
  directory[entry + 1] = size;
  directory.writeUInt16LE(1, entry + 4);
  directory.writeUInt16LE(32, entry + 6);
  directory.writeUInt32LE(iconBuffers.get(size).length, entry + 8);
  directory.writeUInt32LE(offset, entry + 12);
  offset += iconBuffers.get(size).length;
});
await save('favicon.ico', Buffer.concat([directory, ...sizes.map((size) => iconBuffers.get(size))]));

const homepage = h("div", { style: { display: "flex", width: "100%", height: "100%", background: colors.paper, color: colors.ink, fontFamily: "Geist", padding: "58px 64px", alignItems: "center", justifyContent: "space-between" } },
  h("div", { style: { display: "flex", flexDirection: "column", height: "100%", width: 700 } },
    wordmark(64),
    h("div", { style: { display: "flex", flexDirection: "column", fontFamily: "Noto Sans SC", fontSize: 60, fontWeight: 600, lineHeight: 1.35, marginTop: 62 } }, h("span", null, "把实践，"), h("span", null, "写成有用的记录")),
    h("div", { style: { fontSize: 25, color: colors.secondary, marginTop: "auto" } }, "0xmason.com")),
  h("img", { src: png(avatar), width: 350, height: 350, style: { objectFit: "cover", borderRadius: "50%" }, alt: "Mason" }));
await save('images/social/mason.png', await render(homepage, 1200, 630));

const bybit = h("div", { style: { display: "flex", flexDirection: "column", width: "100%", height: "100%", background: colors.paper, color: colors.ink, fontFamily: "Geist", padding: "32px 40px", justifyContent: "space-between" } },
  h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } }, wordmark(36), h("span", { style: { fontSize: 22, color: colors.secondary } }, "BYBIT EU / FIELD NOTES")),
  h("img", { src: png(cover), width: 1120, height: 448, alt: "Bybit EU" }),
  h("div", { style: { fontSize: 20, color: colors.secondary } }, "0xmason.com"));
await save('images/social/bybit-eu.png', await render(bybit, 1200, 630));
const xesimCover = await readImage('images/articles/xesim/xesim_cover_2000x800.png');
const xesim = h("div", { style: { display: "flex", flexDirection: "column", width: "100%", height: "100%", background: colors.paper, color: colors.ink, fontFamily: "Geist", padding: "32px 40px", justifyContent: "space-between" } },
  h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } }, wordmark(36), h("span", { style: { fontSize: 22, color: colors.secondary } }, "XESIM / FIELD NOTES")),
  h("img", { src: png(xesimCover), width: 1120, height: 448, alt: "Xesim X2 Pro" }),
  h("div", { style: { fontSize: 20, color: colors.secondary } }, "0xmason.com"));
await save('images/social/xesim.png', await render(xesim, 1200, 630));
closeStorage();
console.log('Generated and verified 8 brand assets on cdn.0xmason.com. No local image files were written.');
