docker run --rm -v /Users/gkd/dev/wasm-demo:/src -w /src emscripten/emsdk emcc main.cpp -s WASM=1 -o ./build/index.js -std=c++14
