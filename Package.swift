// swift-tools-version:5.3
import PackageDescription

let package = Package(
    name: "TreeSitterTarmac",
    products: [
        .library(name: "TreeSitterTarmac", targets: ["TreeSitterTarmac"]),
    ],
    dependencies: [
        .package(url: "https://github.com/ChimeHQ/SwiftTreeSitter", from: "0.8.0"),
    ],
    targets: [
        .target(
            name: "TreeSitterTarmac",
            dependencies: [],
            path: ".",
            sources: [
                "src/parser.c",
                // NOTE: if your language has an external scanner, add it here.
            ],
            resources: [
                .copy("queries")
            ],
            publicHeadersPath: "bindings/swift",
            cSettings: [.headerSearchPath("src")]
        ),
        .testTarget(
            name: "TreeSitterTarmacTests",
            dependencies: [
                "SwiftTreeSitter",
                "TreeSitterTarmac",
            ],
            path: "bindings/swift/TreeSitterAsmTests"
        )
    ],
    cLanguageStandard: .c11
)
