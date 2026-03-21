import pathlib

p = pathlib.Path(r"d:/tavern_helper_template-main/src/规则/utils/messageParser.ts")
raw = p.read_text(encoding="utf-8")
ends_nl = raw.endswith("\n")
lines = raw.splitlines()
fixed = False
replacement = (
    "  cleaned = cleaned.replace("
    + "/<think>[\\s\\S]*?<\\/redacted_reasoning>/gi, '');"
)
for i, line in enumerate(lines):
    if (
        "cleaned.replace" in line
        and "redacted_reasoning" in line
        and "<thinking>" in line
        and "[\\s\\S]*?" in line
    ):
        lines[i] = replacement
        fixed = True
        print("fixed line", i + 1)
        break
if not fixed:
    raise SystemExit("no matching line")
out = "\n".join(lines)
if ends_nl:
    out += "\n"
p.write_text(out, encoding="utf-8")
