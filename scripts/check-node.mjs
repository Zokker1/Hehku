const [major, minor] = process.versions.node.split(".").map(Number);
if (!((major === 20 && minor >= 19) || (major === 22 && minor >= 12) || major > 22)) {
  console.error("[HEHKU] Install Node.js 20.19+ or 22.12+ (LTS): https://nodejs.org/");
  process.exit(1);
}
