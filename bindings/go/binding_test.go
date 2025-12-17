package tree_sitter_tarmac_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_tarmac "github.com/RubixDev/tree-sitter-tarmac/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_tarmac.Language())
	if language == nil {
		t.Errorf("Error loading Tarmac grammar")
	}
}
