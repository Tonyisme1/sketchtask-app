import fs from "fs";
import path from "path";

const clientDir = path.resolve("client");
const srcDir = path.resolve("client/src");
const visited = new Set();

function resolveImport(importPath, sourceFile) {
  if (!importPath.startsWith(".")) return null;
  const dir = path.dirname(sourceFile);
  const potentialPaths = [
    path.resolve(dir, importPath),
    path.resolve(dir, `${importPath}.ts`),
    path.resolve(dir, `${importPath}.tsx`),
    path.resolve(dir, `${importPath}.js`),
    path.resolve(dir, `${importPath}.jsx`),
    path.resolve(dir, `${importPath}.css`),
    path.resolve(dir, `${importPath}.json`),
    path.resolve(dir, importPath, "index.ts"),
    path.resolve(dir, importPath, "index.tsx"),
  ];
  for (const p of potentialPaths) {
    if (fs.existsSync(p) && fs.statSync(p).isFile()) {
      return p;
    }
  }
  return null;
}

function traverse(filePath) {
  const norm = path.normalize(filePath);
  if (visited.has(norm)) return;
  visited.add(norm);

  if (!fs.existsSync(norm)) return;
  const content = fs.readFileSync(norm, "utf8");

  const importRegex =
    /(?:import|export)\s+(?:(?:[\s\w*$,{}]+from\s+)?["']([^"']+)["']|["']([^"']+)["'])|import\(["']([^"']+)["']\)|require\(["']([^"']+)["']\)/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1] || match[2] || match[3] || match[4];
    if (importPath) {
      const resolved = resolveImport(importPath, norm);
      if (resolved) {
        traverse(resolved);
      }
    }
  }
}

// Start from main entry points
traverse(path.resolve("client/src/main.tsx"));
traverse(path.resolve("client/src/index.css"));
traverse(path.resolve("client/src/vite-env.d.ts"));

// Gather all files in src
const allSrcFiles = [];
function gather(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, f.name);
    if (f.isDirectory()) gather(full);
    else allSrcFiles.push(full);
  }
}
gather(srcDir);

const structuralFiles = new Set([".gitkeep"]);
const unreachable = allSrcFiles.filter(
  (f) => !visited.has(path.normalize(f)) && !structuralFiles.has(path.basename(f)),
);

console.log("=== UNREACHABLE / UNUSED FILES IN client/src ===");
unreachable.forEach((f) => {
  console.log(path.relative(clientDir, f).replace(/\\/g, "/"));
});
console.log(`\nTotal unreachable files in client/src: ${unreachable.length}`);
