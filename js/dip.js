document.addEventListener("DOMContentLoaded", async () => {
  // 获取相关的 HTML 元素
  const video = document.querySelector(".video");
  const fpsNumDisplayElement = document.querySelector(".fps-num");
  const canvas = document.querySelector(".canvas");
  let context = canvas.getContext("2d");

  const btn = document.querySelector("button");
  const STATUS = ["STOP", "JS", "WASM"]; // 全局状态
  let globalStatus = "STOP"; // 当前状态

  // 记录每帧绘制时间
  let jsTimeRecords = [],
    wasmTimeRecords = [];
  let clientX, clientY;

  // 自动播放 <video> 载入的视频
  video.play().catch((error) => {
    console.error("The video can not autoplay!");
  });

  // 定义绘制函数;
  function draw() {
    const timeStart = performance.now();
    context.drawImage(video, 0, 0); // 调用 drawImage 函数绘制图像到 <canvas>
    // 获得 <canvas> 上当前帧对应画面的像素数组
    let pixels = context.getImageData(
      0,
      0,
      video.videoWidth,
      video.videoHeight
    );

    switch (globalStatus) {
      case "JS": {
        pixels.data.set(filterJS(pixels.data, clientX, clientY));
        break;
      }
      case "WASM": {
        // pixels.data.set(filterWasm(pixels.data, clientX, clientY));
        break;
      }
    }
    context.putImageData(pixels, 0, 0);

    let timeUsed = performance.now() - timeStart;
    // 更新FPSNumber
    switch (globalStatus) {
      case "JS": {
        jsTimeRecords.push(timeUsed);
        fpsNumDisplayElement.innerHTML = calcFPS(jsTimeRecords);
        break;
      }
      case "WASM": {
        wasmTimeRecords.push(timeUsed);
        fpsNumDisplayElement.innerHTML = calcFPS(wasmTimeRecords);
        break;
      }
      default:
        wasmTimeRecords.push(timeUsed);
        fpsNumDisplayElement.innerHTML = calcFPS(wasmTimeRecords);
    }

    requestAnimationFrame(draw);
  }

  // <video> 视频资源加载完毕后执行
  video.addEventListener("loadeddata", () => {
    // 根据 <video> 载入视频大小调整对应的 <canvas> 尺寸
    canvas.setAttribute("height", video.videoHeight);
    canvas.setAttribute("width", video.videoWidth);
    clientX = canvas.clientWidth;
    clientY = canvas.clientHeight;
    draw(context); // 绘制函数入口
  });

  // 监听用户点击事件;
  btn.addEventListener("click", () => {
    let checkedNumber = document.querySelector(
      "input[name='options']:checked"
    ).value;
    globalStatus = STATUS[Number(checkedNumber)];
  });

  const calcFPS = (vector) => {
    // 取前二十个数据
    const AVERAGE_RECORDS_COUNT = 20;
    if (vector.length > AVERAGE_RECORDS_COUNT) {
      vector.shift();
    }
    let averageTime =
      vector.reduce((a, b) => a + b, 0) / Math.abs(AVERAGE_RECORDS_COUNT);
    let fps = (1000 / averageTime).toFixed(2);
    return fps;
  };

  // 180度翻转矩阵
  const flipKernel = (kernel) => {
    const h = kernel.length;
    const half = Math.floor(h / 2);
    // 按中心对称的方式将矩阵中的数字上下、左右进行互换
    for (let i = 0; i < half; ++i) {
      for (let j = 0; j < h; ++j) {
        let _t = kernel[i][j];
        kernel[i][j] = kernel[h - i - 1][h - j - 1];
        kernel[h - i - 1][h - j - 1] = _t;
      }
    }
    // 处理矩阵行数为奇数的情况
    if (h & 1) {
      // 将中间行左右两侧对称位置的数进行互换
      for (let j = 0; j < half; ++j) {
        let _t = kernel[half][j];
        kernel[half][j] = kernel[half][h - j - 1];
        kernel[half][h - j - 1] = _t;
      }
    }
    return kernel;
  };

  // 明亮滤镜
  const kernel = flipKernel([
    [-1, -1, -1],
    [-1, 14, -1],
    [1, -1, -1],
  ]);

  // 图像锐化
  // const kernel = flipKernel([
  //   [-1, -1, -1],
  //   [-1, 9, -1],
  //   [-1, -1, -1],
  // ]);

  const jsConvFilter = (data, width, height, kernel) => {
    const divisor = 4; // 分量调节参数
    const h = kernel.length,
      w = h; // 保存卷积核数组的宽和高
    const half = Math.floor(h / 2);

    // 根据卷积核的大小来忽略对边缘像素的处理
    for (let y = half; y < height - half; ++y) {
      for (let x = half; x < width - half; ++x) {
        const px = (y * width + x) * 4; //每个像素点在像素分量数组中的起始位置
        let r = 0,
          g = 0,
          b = 0;
        // 与卷积核矩阵数组进行运算
        for (let cy = 0; cy < h; ++cy) {
          for (let cx = 0; cx < w; ++cx) {
            // 获取卷积核矩阵所覆盖位置的每一个像素的起始偏移位置
            const cpx = ((y + (cy - half)) * width + (x + (cx - half))) * 4;
            // 累加
            r += data[cpx + 0] * kernel[cy][cx];
            g += data[cpx + 1] * kernel[cy][cx];
            b += data[cpx + 2] * kernel[cy][cx];
          }
        }
        // 处理RGB分量的范围
        data[px + 0] =
          r / divisor > 255 ? 255 : r / divisor < 0 ? 0 : r / divisor;
        data[px + 1] =
          g / divisor > 255 ? 255 : g / divisor < 0 ? 0 : g / divisor;
        data[px + 2] =
          b / divisor > 255 ? 255 : b / divisor < 0 ? 0 : b / divisor;
      }
    }
    return data;
  };

  const filterJS = (pixelData, width, height) => {
    return jsConvFilter(pixelData, width, height, kernel);
  };
});
