cmake_minimum_required(VERSION 3.21)
project(wasm_demo)

set(CMAKE_CXX_STANDARD 14)

# emscripten 库，链接 https://github.com/emscripten-core/emscripten
include_directories(/Users/gkd/env/lib/emscripten/system/include)

add_executable(wasm_demo main.cpp)
