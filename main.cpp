#include <emscripten.h>
#include <iostream>

// 防止函数名被 C++ Name Mangling 改变
extern "C" {

// 确保函数不会被优化掉
EMSCRIPTEN_KEEPALIVE
int add(int x, int y) {
    return x + y;
}
}

int main(int argc, char **argv) {
    std::cout << add(10, 20) << std::endl;
    return 0;
}
