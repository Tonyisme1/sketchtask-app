/**
 * Tool Audit Icons & Emojis: Quét toàn bộ mã nguồn `client/src`
 * Liệt kê các icon từ lucide-react, DynamicIcon và các Emoji thô cần rà soát.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.resolve(__dirname, "../client/src");

function walkDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath, fileList);
    } else if (/\.(tsx|ts|jsx|js)$/.test(file)) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

function auditIcons() {
  const files = walkDir(SRC_DIR);
  const iconUsage = new Map();
  const allLucideIcons = new Set();
  const unusedLucideImports = [];
  const emojiOccurrences = [];
  let totalLucideImportStatements = 0;

  // Regex Unicode Emoji phổ biến
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;

  files.forEach((file) => {
    const relPath = path.relative(path.resolve(__dirname, ".."), file).replace(/\\/g, "/");
    const content = fs.readFileSync(file, "utf-8");

    // Bỏ qua các file cấu hình chọn Emoji hợp lệ của người dùng
    const isEmojiConfig =
      relPath.includes("CustomEmojiPicker") ||
      relPath.includes("defaultData") ||
      relPath.includes("types");

    // 1. Quét Import Lucide React & phát hiện icon import dư
    const importRegex = /import\s*\{([^}]+)\}\s*from\s*["']lucide-react["']/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      totalLucideImportStatements++;
      const rawNames = match[1].split(",");
        // Loại bỏ toàn bộ statement import, kể cả import được xuống nhiều dòng.
        const restOfContent = content.slice(0, match.index) + content.slice(match.index + match[0].length);

      rawNames.forEach((raw) => {
        const cleaned = raw.trim();
        if (!cleaned) return;
        const aliasMatch = cleaned.match(/^(\w+)\s+as\s+(\w+)$/);
        const iconName = aliasMatch ? aliasMatch[1] : cleaned;
        const usedName = aliasMatch ? aliasMatch[2] : cleaned;

        allLucideIcons.add(iconName);

        const usageRegex = new RegExp(`\\b${usedName}\\b`);
        if (!usageRegex.test(restOfContent)) {
          unusedLucideImports.push({
            file: relPath,
            line: content.slice(0, match.index).split("\n").length,
            icon: iconName,
            alias: aliasMatch ? usedName : undefined,
          });
        }
      });
    }

    // 2. Quét DynamicIcon & Emojis
    const lines = content.split("\n");
    lines.forEach((line, idx) => {
      const dynamicMatch = line.match(/<DynamicIcon[^>]*name=\{?["']?([^"'}]+)["']?\}?/);
      if (dynamicMatch) {
        const iconName = dynamicMatch[1];
        if (!iconUsage.has(iconName)) {
          iconUsage.set(iconName, []);
        }
        iconUsage.get(iconName).push({ file: relPath, line: idx + 1 });
      }

      const trimmedLine = line.trim();
      const isCommentLine =
        trimmedLine.startsWith("//") ||
        trimmedLine.startsWith("/*") ||
        trimmedLine.startsWith("*") ||
        trimmedLine.startsWith("{/*");

      if (!isEmojiConfig && !isCommentLine) {
        const emMatches = line.match(emojiRegex);
        if (emMatches) {
          emojiOccurrences.push({
            file: relPath,
            line: idx + 1,
            emojis: emMatches.join(" "),
            text: line.trim(),
          });
        }
      }
    });
  });

  console.log("=================================================");
  console.log("    BÁO CÁO TOÀN DIỆN AUDIT ICON & EMOJI        ");
  console.log("=================================================");
  console.log(`📁 Tổng số file mã nguồn được quét : ${files.length}`);
  console.log(`📦 Số file có import lucide-react   : ${totalLucideImportStatements}`);
  console.log(`🎨 Tổng số icon Lucide độc nhất dùng: ${allLucideIcons.size}`);
  console.log(`⚡ Số biểu tượng DynamicIcon         : ${iconUsage.size}`);
  console.log(`⚠️  Số icon import DƯ THỪA (unused)  : ${unusedLucideImports.length}`);
  console.log(`✨ Số vị trí Emoji thô trong code   : ${emojiOccurrences.length}`);

  if (unusedLucideImports.length > 0) {
    console.log("\n--- Chi tiết import icon chưa dùng ---");
    unusedLucideImports.forEach((item) => {
      const alias = item.alias ? ` as ${item.alias}` : "";
      console.log(`  - ${item.file}:${item.line} -> ${item.icon}${alias}`);
    });
  }

  if (emojiOccurrences.length > 0) {
    console.log("\n--- Chi tiết các vị trí Emoji thô ---");
    emojiOccurrences.forEach((item, index) => {
      console.log(`  ${index + 1}. [${item.emojis}] tại ${item.file}:${item.line}`);
      console.log(`     ↳ Code: ${item.text.slice(0, 100)}`);
    });
  }
}

auditIcons();
