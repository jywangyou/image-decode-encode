/**
 * ImageSteganography - 基于 LSB 的图片隐写术库
 *
 * 在图片像素的最低有效位中嵌入加密文本信息，
 * 使用 sjcl 进行 AES 加密，通过 SHA-256 哈希生成伪随机像素序列。
 *
 * @version 1.0.0
 * @license MIT
 * @requires sjcl (Stanford Javascript Crypto Library)
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    define(["sjcl"], factory);
  } else if (typeof module === "object" && module.exports) {
    module.exports = factory(require("../lib/sjcl"));
  } else {
    root.ImageSteganography = factory(root.sjcl);
  }
})(typeof self !== "undefined" ? self : this, function (sjcl) {
  "use strict";

  if (!sjcl) {
    throw new Error(
      "ImageSteganography requires sjcl. Please include sjcl.js before steganography.js"
    );
  }

  var DEFAULTS = {
    maxMessageLength: 1000,
    outputFormat: "image/png",
    quality: 1.0
  };

  function mergeOptions(opts) {
    var result = {};
    for (var key in DEFAULTS) {
      if (DEFAULTS.hasOwnProperty(key)) {
        result[key] =
          opts && opts[key] !== undefined ? opts[key] : DEFAULTS[key];
      }
    }
    return result;
  }

  function getBit(number, location) {
    return (number >> location) & 1;
  }

  function setBit(number, location, bit) {
    return (number & ~(1 << location)) | (bit << location);
  }

  function getBitsFromNumber(number) {
    var bits = [];
    for (var i = 0; i < 16; i++) {
      bits.push(getBit(number, i));
    }
    return bits;
  }

  function getNumberFromBits(colors, history, hash) {
    var number = 0;
    var pos = 0;
    while (pos < 16) {
      var loc = getNextLocation(history, hash, colors.length);
      var bit = getBit(colors[loc], 0);
      number = setBit(number, pos, bit);
      pos++;
    }
    return number;
  }

  function getMessageBits(message) {
    var messageBits = [];
    for (var i = 0; i < message.length; i++) {
      var code = message.charCodeAt(i);
      messageBits = messageBits.concat(getBitsFromNumber(code));
    }
    return messageBits;
  }

  function getNextLocation(history, hash, total) {
    var pos = history.length;
    var loc = Math.abs(hash[pos % hash.length] * (pos + 1)) % total;

    while (true) {
      if (loc >= total) {
        loc = 0;
      } else if (history.indexOf(loc) >= 0) {
        loc++;
      } else if ((loc + 1) % 4 === 0) {
        loc++;
      } else {
        history.push(loc);
        return loc;
      }
    }
  }

  function encodeMessage(colors, hash, message) {
    var messageBits = getBitsFromNumber(message.length);
    messageBits = messageBits.concat(getMessageBits(message));

    var history = [];
    var pos = 0;

    while (pos < messageBits.length) {
      var loc = getNextLocation(history, hash, colors.length);
      colors[loc] = setBit(colors[loc], 0, messageBits[pos]);
      while ((loc + 1) % 4 !== 0) {
        loc++;
      }
      colors[loc] = 255;
      pos++;
    }
  }

  function decodeMessage(colors, hash, maxMessageLength) {
    var history = [];
    var messageSize = getNumberFromBits(colors, history, hash);

    if ((messageSize + 1) * 16 > colors.length * 0.75) {
      return "";
    }
    if (messageSize === 0 || messageSize > maxMessageLength) {
      return "";
    }

    var message = [];
    for (var i = 0; i < messageSize; i++) {
      var code = getNumberFromBits(colors, history, hash);
      message.push(String.fromCharCode(code));
    }
    return message.join("");
  }

  function loadCanvas(imageSource) {
    return new Promise(function (resolve, reject) {
      if (
        typeof HTMLCanvasElement !== "undefined" &&
        imageSource instanceof HTMLCanvasElement
      ) {
        resolve(imageSource);
        return;
      }
      if (
        typeof HTMLImageElement !== "undefined" &&
        imageSource instanceof HTMLImageElement
      ) {
        var canvas = document.createElement("canvas");
        canvas.width = imageSource.naturalWidth || imageSource.width;
        canvas.height = imageSource.naturalHeight || imageSource.height;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(imageSource, 0, 0);
        resolve(canvas);
        return;
      }
      if (
        imageSource instanceof ArrayBuffer ||
        imageSource instanceof Uint8Array
      ) {
        var blob = new Blob([imageSource]);
        var url = URL.createObjectURL(blob);
        var img = new Image();
        img.onload = function () {
          var canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          var ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          URL.revokeObjectURL(url);
          resolve(canvas);
        };
        img.onerror = function () {
          URL.revokeObjectURL(url);
          reject(new Error("无法从缓冲区加载图片"));
        };
        img.src = url;
        return;
      }
      reject(
        new Error(
          "不支持的图片来源，请使用 HTMLCanvasElement、HTMLImageElement 或 ArrayBuffer。"
        )
      );
    });
  }

  function encode(imageSource, text, password, userOptions) {
    var opts = mergeOptions(userOptions);

    if (!text || text.length === 0) {
      return Promise.reject(new Error("隐藏文本不能为空。"));
    }

    password = password || "";

    return loadCanvas(imageSource).then(function (canvas) {
      var ctx = canvas.getContext("2d");
      var message;

      if (password.length > 0) {
        message = sjcl.encrypt(password, text);
      } else {
        message = JSON.stringify({ text: text });
      }

      var pixelCount = ctx.canvas.width * ctx.canvas.height;

      if ((message.length + 1) * 16 > pixelCount * 4 * 0.75) {
        throw new Error(
          "需要隐藏的文本信息相对于图片来说太长了，请减少文字或使用更大的图片！"
        );
      }

      if (message.length > opts.maxMessageLength) {
        throw new Error(
          "需要隐藏的信息太长，最大为：" + opts.maxMessageLength + " 个字符。"
        );
      }

      var imgData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
      var hash = sjcl.hash.sha256.hash(password);

      encodeMessage(imgData.data, hash, message);

      ctx.putImageData(imgData, 0, 0);
      return canvas.toDataURL(opts.outputFormat, opts.quality);
    });
  }

  function decode(imageSource, password, userOptions) {
    var opts = mergeOptions(userOptions);

    password = password || "";

    return loadCanvas(imageSource).then(function (canvas) {
      var ctx = canvas.getContext("2d");
      var imgData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
      var hash = sjcl.hash.sha256.hash(password);

      var message = decodeMessage(imgData.data, hash, opts.maxMessageLength);

      if (!message) {
        throw new Error("未找到隐藏信息或密码错误。");
      }

      var obj = null;
      try {
        obj = JSON.parse(message);
      } catch (e) {
        if (password.length > 0) {
          throw new Error("密码错误，无法解密信息。");
        }
        throw new Error("解密失败，数据格式异常。");
      }

      if (!obj) {
        throw new Error("密码错误，无法解密信息。");
      }

      if (obj.ct) {
        try {
          obj.text = sjcl.decrypt(password, message);
        } catch (e) {
          throw new Error("密码错误，无法解密信息。");
        }
      }

      return obj.text;
    });
  }

  function estimateCapacity(canvas) {
    var pixelCount = canvas.width * canvas.height;
    return Math.floor(pixelCount * 4 * 0.75 / 16) - 1;
  }

  function getVersion() {
    return "1.0.0";
  }

  function getDefaults() {
    return mergeOptions(null);
  }

  return {
    encode: encode,
    decode: decode,
    estimateCapacity: estimateCapacity,
    loadCanvas: loadCanvas,
    getVersion: getVersion,
    getDefaults: getDefaults,
    mergeOptions: mergeOptions,
    DEFAULTS: DEFAULTS
  };
});
