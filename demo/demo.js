(function () {
  "use strict";

  var $ = function (id) {
    return document.getElementById(id);
  };

  var tabs = document.querySelectorAll(".tab-btn");
  var panels = document.querySelectorAll(".panel");

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var target = this.getAttribute("data-tab");
      tabs.forEach(function (t) {
        t.classList.remove("active");
      });
      panels.forEach(function (p) {
        p.classList.remove("active");
      });
      this.classList.add("active");
      $(target + "-panel").classList.add("active");
    });
  });

  var encodePwdToggle = $("encode-pwd-toggle");
  var encodePwdInput = $("encode-password");
  var encodePwdLabel = $("encode-pwd-toggle-label");
  var encodePwdTag = $("encode-pwd-tag");

  encodePwdToggle.addEventListener("change", function () {
    if (this.checked) {
      encodePwdInput.style.display = "block";
      encodePwdInput.focus();
      encodePwdLabel.textContent = "使用密码";
      encodePwdTag.textContent = "已启用";
      encodePwdTag.classList.add("active");
    } else {
      encodePwdInput.style.display = "none";
      encodePwdInput.value = "";
      encodePwdLabel.textContent = "不使用密码";
      encodePwdTag.textContent = "可选";
      encodePwdTag.classList.remove("active");
    }
  });

  var decodePwdToggle = $("decode-pwd-toggle");
  var decodePwdInput = $("decode-password");
  var decodePwdLabel = $("decode-pwd-toggle-label");
  var decodePwdTag = $("decode-pwd-tag");

  decodePwdToggle.addEventListener("change", function () {
    if (this.checked) {
      decodePwdInput.style.display = "block";
      decodePwdInput.focus();
      decodePwdLabel.textContent = "使用密码";
      decodePwdTag.textContent = "已启用";
      decodePwdTag.classList.add("active");
    } else {
      decodePwdInput.style.display = "none";
      decodePwdInput.value = "";
      decodePwdLabel.textContent = "不使用密码";
      decodePwdTag.textContent = "可选";
      decodePwdTag.classList.remove("active");
    }
  });

  function setupDropZone(zoneId, inputId, onSelect) {
    var zone = $(zoneId);
    var input = $(inputId);

    zone.addEventListener("click", function () {
      input.click();
    });

    zone.addEventListener("dragover", function (e) {
      e.preventDefault();
      e.stopPropagation();
      this.classList.add("dragover");
    });

    zone.addEventListener("dragleave", function (e) {
      e.preventDefault();
      e.stopPropagation();
      this.classList.remove("dragover");
    });

    zone.addEventListener("drop", function (e) {
      e.preventDefault();
      e.stopPropagation();
      this.classList.remove("dragover");
      if (e.dataTransfer.files.length > 0) {
        input.files = e.dataTransfer.files;
        onSelect(e.dataTransfer.files[0]);
      }
    });

    input.addEventListener("change", function () {
      if (this.files.length > 0) {
        onSelect(this.files[0]);
      }
    });
  }

  var encodeCanvas = null;

  setupDropZone("encode-drop-zone", "encode-file", function (file) {
    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.onload = function () {
        encodeCanvas = document.createElement("canvas");
        encodeCanvas.width = img.width;
        encodeCanvas.height = img.height;
        var ctx = encodeCanvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        $("encode-preview-img").src = e.target.result;
        $("encode-preview").style.display = "flex";
        $("encode-img-info").textContent =
          img.width + " × " + img.height + " 像素";

        var capacity = ImageSteganography.estimateCapacity(encodeCanvas);
        $("encode-capacity-text").textContent =
          "最大可隐藏约 " + capacity + " 个字符";
        var pct = Math.min(100, Math.round((capacity / 1000) * 100));
        $("encode-capacity-fill").style.width = pct + "%";

        $("encode-result").style.display = "none";
        hideAlert("encode-error");
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  var decodeCanvas = null;

  setupDropZone("decode-drop-zone", "decode-file", function (file) {
    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.onload = function () {
        decodeCanvas = document.createElement("canvas");
        decodeCanvas.width = img.width;
        decodeCanvas.height = img.height;
        var ctx = decodeCanvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        $("decode-preview-img").src = e.target.result;
        $("decode-preview").style.display = "flex";
        $("decode-img-info").textContent =
          img.width + " × " + img.height + " 像素";

        hideAlert("decode-error");
        hideAlert("decode-success");
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  function showAlert(elementId, message) {
    var el = $(elementId);
    el.classList.add("show");
    var textEl = $(elementId + "-text");
    if (textEl) {
      textEl.textContent = message;
    }
  }

  function hideAlert(elementId) {
    var el = $(elementId);
    el.classList.remove("show");
  }

  function setLoading(btnId, loading) {
    var btn = $(btnId);
    if (loading) {
      btn.classList.add("loading");
      btn.disabled = true;
    } else {
      btn.classList.remove("loading");
      btn.disabled = false;
    }
  }

  $("encode-btn").addEventListener("click", function () {
    hideAlert("encode-error");
    $("encode-result").style.display = "none";

    if (!encodeCanvas) {
      showAlert("encode-error", "请先选择一张图片！");
      return;
    }

    var message = $("encode-message").value.trim();
    if (!message) {
      showAlert("encode-error", "请输入要隐藏的文字信息！");
      return;
    }

    var password = "";
    if (encodePwdToggle.checked) {
      password = encodePwdInput.value;
      if (!password) {
        showAlert("encode-error", "已启用密码但未输入，请输入密码或关闭密码开关！");
        return;
      }
    }

    setLoading("encode-btn", true);

    var tempCanvas = document.createElement("canvas");
    tempCanvas.width = encodeCanvas.width;
    tempCanvas.height = encodeCanvas.height;
    tempCanvas.getContext("2d").drawImage(encodeCanvas, 0, 0);

    ImageSteganography.encode(tempCanvas, message, password)
      .then(function (dataURL) {
        $("encode-result-img").src = dataURL;
        $("encode-result").style.display = "block";
        setLoading("encode-btn", false);
      })
      .catch(function (err) {
        showAlert("encode-error", err.message);
        setLoading("encode-btn", false);
      });
  });

  $("encode-result-img").addEventListener("click", function () {
    var link = document.createElement("a");
    link.href = this.src;
    link.download = "steganography-" + Date.now() + ".png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  $("decode-btn").addEventListener("click", function () {
    hideAlert("decode-error");
    hideAlert("decode-success");

    if (!decodeCanvas) {
      showAlert("decode-error", "请先选择一张图片！");
      return;
    }

    var password = "";
    if (decodePwdToggle.checked) {
      password = decodePwdInput.value;
      if (!password) {
        showAlert("decode-error", "已启用密码但未输入，请输入密码或关闭密码开关！");
        return;
      }
    }

    setLoading("decode-btn", true);

    var tempCanvas = document.createElement("canvas");
    tempCanvas.width = decodeCanvas.width;
    tempCanvas.height = decodeCanvas.height;
    tempCanvas.getContext("2d").drawImage(decodeCanvas, 0, 0);

    ImageSteganography.decode(tempCanvas, password)
      .then(function (text) {
        var safeText = text
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");

        var content =
          "图片中隐藏的信息为：" +
          '<span class="secret-text">' + safeText + "</span>" +
          '<div class="secret-actions">' +
          '<button class="btn btn-secondary" id="copy-btn">复制解密内容</button>' +
          "</div>";

        $("decode-success-text").innerHTML = content;
        $("decode-success").classList.add("show");
        setLoading("decode-btn", false);

        var copyBtn = $("copy-btn");
        if (copyBtn) {
          copyBtn.addEventListener("click", function () {
            navigator.clipboard
              .writeText(text)
              .then(function () {
                copyBtn.textContent = "已复制！";
                setTimeout(function () {
                  copyBtn.textContent = "复制解密内容";
                }, 2000);
              })
              .catch(function () {
                var ta = document.createElement("textarea");
                ta.value = text;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand("copy");
                document.body.removeChild(ta);
                copyBtn.textContent = "已复制！";
                setTimeout(function () {
                  copyBtn.textContent = "复制解密内容";
                }, 2000);
              });
          });
        }
      })
      .catch(function (err) {
        showAlert("decode-error", err.message);
        setLoading("decode-btn", false);
      });
  });
})();
