# tree-sitter-tarmac

Tree-sitter grammar for Arm Tarmac trace logs.

This grammar is intentionally lightweight and aimed at providing good
syntax highlighting and basic structure for Tarmac log files rather
than full semantic decoding of every ARM instruction.

## Usage in Neovim

You can use this grammar with
[nvim-treesitter](https://github.com/nvim-treesitter/nvim-treesitter)
by pointing a custom parser configuration at this repository and
associating your Tarmac trace files with the `tarmac` filetype.

Example (Lua):

```lua
local parser_config = require('nvim-treesitter.parsers').get_parser_configs()

parser_config.tarmac = {
  install_info = {
    url = '/absolute/path/to/tree-sitter-tarmac',
    files = { 'src/parser.c' },
    generate_requires_npm = true,
  },
  filetype = 'tarmac',
}

vim.api.nvim_create_autocmd({ 'BufRead', 'BufNewFile' }, {
  pattern = '*.tarmac',
  callback = function()
    vim.bo.filetype = 'tarmac'
  end,
})
```

Then enable highlighting via `nvim-treesitter` as usual.

## Development

To build the parser, ensure you have `node` and `npm` installed, then run:

```bash
npm install tree-sitter-cli
npx tree-sitter generate
```

Or just install tree-sitter-cli locally and run:

```bash
tree-sitter generate
```
To test in Neovim, you can use the `:TSPlaygroundToggle` command after opening a tarmac file, OR

```vimscript
:TSUInstall tarmac
:TSUpdate
:InspectTree
```

