; General
((label
   [(ident) (word) (meta_ident)] @label)
 (#set! priority 110))

"clk" @clock

; Registers
((reg) @gprs
  (#set! priority 150)
  (#match? @gprs "^[xX][0-9]+$"))

(reg) @variable.builtin

; Instructions / directives / constants
((instruction
   kind: (word) @function.builtin)
 (#set! priority 110))

(meta
  kind: (_) @function.builtin)

(const
  name: (word) @constant)

; MMU / translation events
((word) @mmu
  (#set! priority 200)
  (#match? @mmu "^(TTW|TLB|PLB|ITLB|DTLB|UTLB|IRTP|IRTU|DPOT0)$"))

((word) @mmu
  (#set! priority 190)
  (#match? @mmu "^(LPAE|BLOCK|FAULT|FILL|EVICT)$"))

((word) @mmu
  (#set! priority 180)
  (#match? @mmu "^(IRTBRP_EL1|IRTBRU_EL1|LDSTT_EL1)$"))

; Decoded instruction text on Tarmac trace lines
(tarmac_trace
  (instruction) @actual_instruction)

; Identifiers & addresses
(meta_ident) @keyword.directive

(address) @constant

(ident) @variable

(word) @variable

; Comments
[
  (line_comment)
  (block_comment)
] @comment @spell

; Literals
(int) @number

(float) @number.float

(string) @string

; Keywords
[
  "byte"
  "word"
  "dword"
  "qword"
  "ptr"
  "rel"
  "label"
  "const"
] @keyword

; Operators & Punctuation
[
  "+"
  "-"
  "*"
  "/"
  "%"
  "|"
  "^"
  "&"
] @operator

[
  "("
  ")"
  "["
  "]"
] @punctuation.bracket

[
  ","
  ":"
] @punctuation.delimiter
