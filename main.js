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
          img.width + " × " + img.height + " px";

        var capacity = ImageSteganography.estimateCapacity(
          encodeCanvas,
          ImageSteganography.getDefaults()
        );
        var pct = Math.min(100, Math.round((capacity / 1000) * 100));
        $("encode-capacity-fill").style.width = pct + "%";
        $("encode-capacity-text").textContent =
          "Max capacity: ~" + capacity + " bytes";

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
          img.width + " × " + img.height + " px";

        hideAlert("decode-error");
        hideAlert("decode-success");
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  function showAlert(type, elementId, message) {
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
      showAlert("error", "encode-error", "Please select a cover image first.");
      return;
    }

    var message = $("encode-message").value.trim();
    if (!message) {
      showAlert("error", "encode-error", "Please enter a message to hide.");
      return;
    }

    var password = $("encode-password").value;
    if (!password) {
      showAlert("error", "encode-error", "Please enter an encryption password.");
      return;
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
        showAlert("error", "encode-error", err.message);
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
      showAlert("error", "decode-error", "Please select an encoded image first.");
      return;
    }

    var password = $("decode-password").value;
    if (!password) {
      showAlert("error", "decode-error", "Please enter the decryption password.");
      return;
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
          "Hidden message found!" +
          '<span class="secret-text">' + safeText + "</span>" +
          '<div class="secret-actions">' +
          '<button class="btn btn-secondary" id="copy-btn">Copy to Clipboard</button>' +
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
                copyBtn.textContent = "Copied!";
                setTimeout(function () {
                  copyBtn.textContent = "Copy to Clipboard";
                }, 2000);
              })
              .catch(function () {
                var ta = document.createElement("textarea");
                ta.value = text;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand("copy");
                document.body.removeChild(ta);
                copyBtn.textContent = "Copied!";
                setTimeout(function () {
                  copyBtn.textContent = "Copy to Clipboard";
                }, 2000);
              });
          });
        }
      })
      .catch(function (err) {
        showAlert("error", "decode-error", err.message);
        setLoading("decode-btn", false);
      });
  });
})();
