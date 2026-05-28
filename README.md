# Image Steganography - 图片隐写术

一个基于 LSB（最低有效位）的图片隐写术 JavaScript 库，使用 sjcl 进行 AES 加密，密码可选，支持将秘密文本隐藏到图片中。

## ✨ 特性

- **AES 加密（可选）** - 支持使用密码进行 AES 加密保护，不设密码也可直接隐写
- **LSB 隐写** - 在图片像素的最低有效位中嵌入加密信息
- **SHA-256 哈希** - 使用密码的 SHA-256 哈希值生成伪随机像素序列
- **密码可选** - 加密和解密时密码均可留空，灵活使用
- **UMD 兼容** - 支持浏览器（script 标签、AMD）和 Node.js（CommonJS）
- **Promise API** - 基于 Promise 的异步接口
- **可配置** - 支持自定义最大消息长度、输出格式等选项

## 🚀 快速开始

### 浏览器

```html
<script src="lib/sjcl.js"></script>
<script src="src/steganography.js"></script>
<script>
  var canvas = document.getElementById('myCanvas');

  // 加密 - 不使用密码（直接隐写）
  ImageSteganography.encode(canvas, 'Hello, World!', '')
    .then(function(dataURL) {
      console.log('加密后的图片:', dataURL);
    });

  // 加密 - 使用密码（AES 加密后再隐写）
  ImageSteganography.encode(canvas, 'Hello, World!', 'myPassword')
    .then(function(dataURL) {
      console.log('加密后的图片:', dataURL);
    });

  // 解密 - 无密码模式
  ImageSteganography.decode(canvas, '')
    .then(function(message) {
      console.log('解密消息:', message);
    });

  // 解密 - 有密码模式
  ImageSteganography.decode(canvas, 'myPassword')
    .then(function(message) {
      console.log('解密消息:', message);
    });
</script>
```

### Node.js

```javascript
var ImageSteganography = require('./src/steganography');

// 使用 canvas 实例（例如 node-canvas）
ImageSteganography.encode(canvas, 'Secret message', 'password123')
  .then(function(dataURL) {
    // dataURL 是 base64 编码的 PNG 字符串
    fs.writeFileSync('output.png', dataURL.split(',')[1], 'base64');
  });
```

## 📚 API 文档

### `ImageSteganography.encode(imageSource, text, password [, options])`

将加密消息隐藏到图片中。

| 参数 | 类型 | 说明 |
|------|------|------|
| `imageSource` | `HTMLCanvasElement`, `HTMLImageElement`, `ArrayBuffer` | 封面图片 |
| `text` | `string` | 要隐藏的消息 |
| `password` | `string` | 加密密码（可选，传空字符串或不传则不加密） |
| `options` | `object` | 可选配置 |

**返回值:** `Promise<string>` - 包含隐藏消息的图片 data URL。

### `ImageSteganography.decode(imageSource, password [, options])`

从编码过的图片中提取隐藏消息。

| 参数 | 类型 | 说明 |
|------|------|------|
| `imageSource` | `HTMLCanvasElement`, `HTMLImageElement`, `ArrayBuffer` | 编码后的图片 |
| `password` | `string` | 解密密码（可选，需与加密时一致） |
| `options` | `object` | 可选配置 |

**返回值:** `Promise<string>` - 解码后的消息。

### `ImageSteganography.estimateCapacity(canvas)`

估算图片可隐藏的最大字符数。

**返回值:** `number` - 最大字符数。

## ⚙️ 配置选项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `maxMessageLength` | `number` | `1000` | 最大消息长度（字符数） |
| `outputFormat` | `string` | `"image/png"` | 输出图片 MIME 类型 |
| `quality` | `number` | `1.0` | 输出图片质量（0-1） |

### 自定义配置示例

```javascript
ImageSteganography.encode(canvas, message, password, {
  maxMessageLength: 2000,
  quality: 0.92,
  outputFormat: 'image/jpeg'
}).then(function(dataURL) {
  // ...
});
```

## 🔧 工作原理

1. **加密（可选）** - 如果设置了密码，使用 sjcl 对明文消息进行 AES-CCM 加密；如果没有密码，直接以 JSON 格式存储明文
2. **哈希** - 使用密码的 SHA-256 哈希值生成伪随机序列（密码为空时使用空字符串的哈希）
3. **嵌入** - 将消息按位嵌入到图片像素的最低有效位
4. **提取** - 解码时重新生成相同的伪随机序列，提取位数据，如果数据是加密的则用密码解密

## 📁 项目结构

```
image-steganography/
├── src/
│   └── steganography.js    # 核心库
├── lib/
│   └── sjcl.js             # Stanford Javascript Crypto Library
├── demo/
│   ├── index.html          # 交互式演示页面
│   ├── demo.css            # 演示样式
│   └── demo.js             # 演示逻辑
├── package.json
├── LICENSE
└── README.md
```

## 🌐 浏览器兼容性

- Chrome 37+
- Firefox 34+
- Safari 11+
- Edge 12+

## 📄 许可证

[MIT](LICENSE)

## 🤝 贡献

欢迎提交 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开 Pull Request
