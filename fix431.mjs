import fs from "fs";
const p = new URL("./src/规则/utils/messageParser.ts", import.meta.url);
const lines = fs.readFileSync(p, "utf8").split(/\r?\n/);
if (!lines[430].includes("redacted_reasoning")) {
  console.error("unexpected line 431:", lines[430]);
  process.exit(1);
}
const lt = "<";
const gt = ">";
lines[430] = `  cleaned = cleaned.replace(/${lt}redacted_reasoning${gt}[\\s\\S]*?${lt}\\/redacted_reasoning${gt}/gi, '');`;
fs.writeFileSync(p, lines.join("\n"));
console.log("patched line 431");
