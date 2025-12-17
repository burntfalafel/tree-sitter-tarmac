import XCTest
import SwiftTreeSitter
import TreeSitterTarmac

final class TreeSitterTarmacTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_tarmac())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Tarmac grammar")
    }
}
