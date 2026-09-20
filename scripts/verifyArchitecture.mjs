import fs from "fs";
import path from "path";

function checkDir(dir, forbiddenPatterns) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const f of files) {
    const full = path.join(dir, f.name);
    if (f.isDirectory()) {
      checkDir(full, forbiddenPatterns);
    } else if (f.name.endsWith(".ts") || f.name.endsWith(".tsx")) {
      const content = fs.readFileSync(full, "utf8");
      for (const pat of forbiddenPatterns) {
        if (pat.test(content)) {
          console.error(`Boundary violation in ${full} matching ${pat}`);
          process.exit(1);
        }
      }
    }
  }
}

// 1. features, shared, utils, types, stores must NOT import platform code
checkDir(path.resolve("client/src/features"), [/from ['"].*(mobile|tablet|desktop)/]);
checkDir(path.resolve("client/src/shared"), [/from ['"].*(mobile|tablet|desktop)/]);
checkDir(path.resolve("client/src/utils"), [/from ['"].*(mobile|tablet|desktop)/]);
checkDir(path.resolve("client/src/stores"), [/from ['"].*(mobile|tablet|desktop)/]);
// 1. Core domains (features, components, hooks, services, stores, types, utils) must NOT import platform code
checkDir(path.resolve("client/src/features"), [/from ['"].*(\/mobile\/|\/tablet\/|\/desktop\/)/]);
checkDir(path.resolve("client/src/components"), [/from ['"].*(\/mobile\/|\/tablet\/|\/desktop\/)/]);
checkDir(path.resolve("client/src/hooks"), [/from ['"].*(\/mobile\/|\/tablet\/|\/desktop\/)/]);
checkDir(path.resolve("client/src/services"), [/from ['"].*(\/mobile\/|\/tablet\/|\/desktop\/)/]);
checkDir(path.resolve("client/src/stores"), [/from ['"].*(\/mobile\/|\/tablet\/|\/desktop\/)/]);
checkDir(path.resolve("client/src/types"), [/from ['"].*(\/mobile\/|\/tablet\/|\/desktop\/)/]);
checkDir(path.resolve("client/src/utils"), [/from ['"].*(\/mobile\/|\/tablet\/|\/desktop\/)/]);

// 2. desktop must NOT import mobile or tablet
checkDir(path.resolve("client/src/desktop"), [/from ['"].*(\/mobile\/|\/tablet\/)/]);

// 3. mobile must NOT import desktop or tablet
checkDir(path.resolve("client/src/mobile"), [/from ['"].*(\/desktop\/|\/tablet\/)/]);

// 4. tablet must NOT import desktop or mobile
checkDir(path.resolve("client/src/tablet"), [/from ['"].*(\/desktop\/|\/mobile\/)/]);

console.log("All architecture boundary checks PASSED!");

