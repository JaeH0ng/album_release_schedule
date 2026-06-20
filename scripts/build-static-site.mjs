import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");

async function ensureDir(target) {
  await mkdir(target, { recursive: true });
}

async function copyFile(relativePath) {
  const source = path.join(rootDir, relativePath);
  const target = path.join(distDir, relativePath);
  await ensureDir(path.dirname(target));
  await cp(source, target);
}

async function copyDocsFolder() {
  const docsDir = path.join(rootDir, "docs");
  const files = await readdir(docsDir);
  for (const file of files.filter((name) => name.endsWith(".md"))) {
    await copyFile(path.join("docs", file));
  }
}

async function copyLyricsFolder() {
  const lyricsDir = path.join(rootDir, "lyrics");
  const files = await readdir(lyricsDir);
  for (const file of files.filter((name) => name.endsWith(".txt") || name.endsWith(".md"))) {
    await copyFile(path.join("lyrics", file));
  }
}

async function copyTrackReadmes() {
  await copyFile(path.join("tracks", "README.md"));
  const tracksDir = path.join(rootDir, "tracks");
  const entries = await readdir(tracksDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const readmePath = path.join("tracks", entry.name, "README.md");
    await copyFile(readmePath);
  }
}

async function stampIndexHtml() {
  const buildVersion = new Date().toISOString().replace(/[^\d]/g, "").slice(0, 14);
  const indexPath = path.join(distDir, "index.html");
  const source = await readFile(indexPath, "utf8");
  const stamped = source
    .replace('<html lang="ko">', `<html lang="ko" data-build-version="${buildVersion}">`)
    .replace('href="assets/icon.svg"', `href="assets/icon.svg?v=${buildVersion}"`)
    .replace('href="manifest.webmanifest"', `href="manifest.webmanifest?v=${buildVersion}"`)
    .replace('href="assets/icon.svg"', `href="assets/icon.svg?v=${buildVersion}"`)
    .replace('href="styles.css"', `href="styles.css?v=${buildVersion}"`)
    .replace('src="app.js"', `src="app.js?v=${buildVersion}"`);

  await writeFile(indexPath, stamped);
}

await rm(distDir, { recursive: true, force: true });
await ensureDir(distDir);

for (const file of ["index.html", "styles.css", "app.js", "manifest.webmanifest", "service-worker.js", "pwa-reset.html"]) {
  await copyFile(file);
}

await copyFile(path.join("assets", "icon.svg"));
await copyDocsFolder();
await copyLyricsFolder();
await copyTrackReadmes();
await stampIndexHtml();

console.log(`Built static site to ${distDir}`);
