#!/bin/bash
set -e

# Build CAT from submodule
echo "Building CAT..."
cd cat
git submodule update --init --recursive
./gradlew build -x test -PenableOptimization
cp cat.jar ../cat.jar
cd ..

# Build the extension
echo "Building extension..."
tsc -p .
vsce package
code --install-extension callgraphexplorer-0.0.2.vsix