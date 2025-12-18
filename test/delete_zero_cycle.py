#
# Do `setup.py install` first
#
import sys
from tree_sitter import Language, Parser
import tree_sitter_tarmac

input_path = sys.argv[1] if len(sys.argv) > 1 else "test.tarmac"
output_path = sys.argv[2] if len(sys.argv) > 2 else input_path + ".no_zero_cycles"

source_bytes = open(input_path, "rb").read()
lines = source_bytes.decode("utf-8", errors="replace").splitlines(keepends=True)

# Set up parser with the Tarmac language
lang = Language(tree_sitter_tarmac.language())
parser = Parser()
parser.language = lang
# parser.set_language(lang)

tree = parser.parse(source_bytes)
root = tree.root_node

rows_to_drop = set()

for node in root.children:
  if not node.is_named:
      continue
  if node.type != "tarmac_trace":
      continue

  cycle = node.child_by_field_name("cycle")
  if cycle is None:
      continue

  cycle_text = source_bytes[cycle.start_byte:cycle.end_byte].decode("utf-8", errors="replace").strip()
  try:
      if int(cycle_text, 10) == 0:
          rows_to_drop.add(node.start_point[0])  # 0-based row index
  except ValueError:
      # If it's not a plain decimal, just ignore it
      continue

with open(output_path, "w", encoding="utf-8", newline="") as f:
  for i, line in enumerate(lines):
      if i not in rows_to_drop:
          f.write(line)

print(f"Removed {len(rows_to_drop)} tarmac_trace line(s) with cycle=0")
print(f"Input:  {input_path}")
print(f"Output: {output_path}")
