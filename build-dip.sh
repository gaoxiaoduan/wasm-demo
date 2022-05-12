docker run --rm -v /Users/gkd/dev/wasm-demo:/src -w /src emscripten/emsdk emcc dip.cpp -s WASM=1 -O3 --no-entry -o ./build/dip.wasm -std=c++14
