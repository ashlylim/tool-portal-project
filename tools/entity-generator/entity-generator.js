// Entity Generator: turns a form (entity name + ports) into VHDL code.
// Everything runs in the browser; nothing is sent anywhere.
(function () {
  "use strict";

  // ---------- Settings ----------
  var MODES = ["in", "out", "inout", "buffer"];
  var TYPES = ["std_logic", "std_logic_vector", "unsigned", "signed"];
  var VECTOR_TYPES = ["std_logic_vector", "unsigned", "signed"];
  var MAX_WIDTH = 1024;

  // VHDL-2008 reserved words: these cannot be used as names.
  var RESERVED = ("abs access after alias all and architecture array assert assume " +
    "assume_guarantee attribute begin block body buffer bus case component configuration " +
    "constant context cover default disconnect downto else elsif end entity exit fairness " +
    "file for force function generate generic group guarded if impure in inertial inout is " +
    "label library linkage literal loop map mod nand new next nor not null of on open or " +
    "others out package parameter port postponed procedure process property protected pure " +
    "range record register reject release rem report restrict restrict_guarantee return rol " +
    "ror select sequence severity shared signal sla sll sra srl strong subtype then to " +
    "transport type unaffected units until use variable vmode vprop vunit wait when while " +
    "with xnor xor").split(" ");

  // Example the page starts with, so students see a result straight away.
  var EXAMPLE_PORTS = [
    { name: "clk", mode: "in", type: "std_logic", width: "8" },
    { name: "reset", mode: "in", type: "std_logic", width: "8" },
    { name: "count", mode: "out", type: "std_logic_vector", width: "8" }
  ];

  // ---------- Page elements ----------
  var entityInput = document.getElementById("entity-name");
  var archInput = document.getElementById("arch-name");
  var portList = document.getElementById("port-list");
  var portsError = document.getElementById("ports-error");
  var addPortBtn = document.getElementById("add-port");
  var output = document.getElementById("output");
  var copyBtn = document.getElementById("copy-btn");
  var downloadBtn = document.getElementById("download-btn");
  var statusEl = document.getElementById("status");

  var nextId = 1;        // keeps element ids unique as rows come and go
  var currentCode = "";  // last valid VHDL, used by Copy and Download

  // ---------- Checks ----------
  // Returns a plain-language problem, or "" when the name is fine.
  function checkName(value) {
    if (value === "") return "Enter a name.";
    if (!/^[A-Za-z]/.test(value)) return "A name must start with a letter.";
    if (/[^A-Za-z0-9_]/.test(value)) return "Use only letters, digits and _ (no spaces or symbols).";
    if (/__/.test(value)) return "Two underscores in a row (__) are not allowed.";
    if (/_$/.test(value)) return "A name can't end with _.";
    if (RESERVED.indexOf(value.toLowerCase()) !== -1) {
      return "\"" + value + "\" is a VHDL keyword, so it can't be a name. Try adding to it, e.g. " + value + "_1.";
    }
    return "";
  }

  function checkWidth(value) {
    if (value === "") return "Enter a width.";
    if (!/^\d+$/.test(value)) return "Use a whole number, like 8.";
    var n = parseInt(value, 10);
    if (n < 1 || n > MAX_WIDTH) return "Use a number from 1 to " + MAX_WIDTH + ".";
    return "";
  }

  function isVector(type) {
    return VECTOR_TYPES.indexOf(type) !== -1;
  }

  // ---------- Port rows ----------
  function optionList(values, selected) {
    return values.map(function (v) {
      return '<option value="' + v + '"' + (v === selected ? " selected" : "") + ">" + v + "</option>";
    }).join("");
  }

  function addPortRow(port, focus) {
    var id = "p" + nextId++;
    var li = document.createElement("li");
    li.className = "port-row";
    li.innerHTML =
      '<h3 class="port-title"></h3>' +
      '<div class="port-fields">' +
        '<div class="field">' +
          '<label for="' + id + '-name">Name</label>' +
          '<input type="text" id="' + id + '-name" class="port-name" autocomplete="off" spellcheck="false" aria-describedby="' + id + '-name-error">' +
          '<p class="error" id="' + id + '-name-error"></p>' +
        "</div>" +
        '<div class="field">' +
          '<label for="' + id + '-mode">Mode</label>' +
          '<select id="' + id + '-mode" class="port-mode">' + optionList(MODES, port.mode) + "</select>" +
        "</div>" +
        '<div class="field">' +
          '<label for="' + id + '-type">Type</label>' +
          '<select id="' + id + '-type" class="port-type">' + optionList(TYPES, port.type) + "</select>" +
        "</div>" +
        '<div class="field port-width-field">' +
          '<label for="' + id + '-width">Width (bits)</label>' +
          '<input type="text" inputmode="numeric" id="' + id + '-width" class="port-width" autocomplete="off" aria-describedby="' + id + '-width-error">' +
          '<p class="error" id="' + id + '-width-error"></p>' +
        "</div>" +
        '<button type="button" class="button port-remove">Remove</button>' +
      "</div>";

    // Set values through properties so typed text is never treated as HTML.
    li.querySelector(".port-name").value = port.name;
    li.querySelector(".port-width").value = port.width;
    portList.appendChild(li);
    renumberRows();
    if (focus) li.querySelector(".port-name").focus();
  }

  function renumberRows() {
    var rows = portList.querySelectorAll(".port-row");
    rows.forEach(function (row, i) {
      row.querySelector(".port-title").textContent = "Port " + (i + 1);
      row.querySelector(".port-remove").setAttribute("aria-label", "Remove port " + (i + 1));
    });
  }

  // "Touched" fields show their errors. A brand-new empty row stays quiet
  // until the student types in it or leaves it.
  function markTouched(el) {
    el.setAttribute("data-touched", "true");
  }

  function showError(input, errorEl, message) {
    var visible = message && input.getAttribute("data-touched") === "true";
    errorEl.textContent = visible ? message : "";
    if (visible) {
      input.setAttribute("aria-invalid", "true");
    } else {
      input.removeAttribute("aria-invalid");
    }
  }

  // ---------- Read and check the whole form ----------
  function readForm() {
    var ok = true;
    var entity = entityInput.value.trim();
    var arch = archInput.value.trim();

    var entityProblem = checkName(entity);
    var archProblem = checkName(arch);
    showError(entityInput, document.getElementById("entity-name-error"), entityProblem);
    showError(archInput, document.getElementById("arch-name-error"), archProblem);
    if (entityProblem || archProblem) ok = false;

    var ports = [];
    var seen = {}; // lower-case name -> true (VHDL ignores upper/lower case)
    portList.querySelectorAll(".port-row").forEach(function (row) {
      var nameInput = row.querySelector(".port-name");
      var widthInput = row.querySelector(".port-width");
      var type = row.querySelector(".port-type").value;
      var mode = row.querySelector(".port-mode").value;
      var name = nameInput.value.trim();
      var width = widthInput.value.trim();
      var vector = isVector(type);

      row.querySelector(".port-width-field").hidden = !vector;

      var nameProblem = checkName(name);
      if (!nameProblem) {
        var key = name.toLowerCase();
        if (seen[key]) {
          nameProblem = "Another port is already called \"" + name + "\" (VHDL ignores upper/lower case).";
        } else if (key === entity.toLowerCase()) {
          nameProblem = "A port can't share the entity's name: it would hide the entity's name inside the block.";
        }
        seen[key] = true;
      }
      var widthProblem = vector ? checkWidth(width) : "";

      showError(nameInput, row.querySelector(".port-name + .error"), nameProblem);
      showError(widthInput, row.querySelector(".port-width + .error"), widthProblem);
      if (nameProblem || widthProblem) ok = false;

      ports.push({ name: name, mode: mode, type: type, width: vector ? parseInt(width, 10) : 0 });
    });

    if (ports.length === 0) {
      portsError.textContent = "Add at least one port: every entity needs a way in or out.";
      ok = false;
    } else {
      portsError.textContent = "";
    }

    return ok ? { entity: entity, arch: arch, ports: ports } : null;
  }

  // ---------- Build the VHDL text ----------
  function padRight(text, length) {
    while (text.length < length) text += " ";
    return text;
  }

  function typeText(port) {
    return isVector(port.type) ? port.type + "(" + (port.width - 1) + " downto 0)" : port.type;
  }

  // A short plain-language comment for each port.
  function portComment(port) {
    if (port.type === "std_logic") return "1 wire";
    var w = port.width;
    if (port.type === "std_logic_vector") {
      return w === 1 ? "1 wire (bit 0)" : w + " wires, bit " + (w - 1) + " is the MSB";
    }
    if (port.type === "unsigned") {
      return w <= 32 ? w + "-bit number, 0 to " + (Math.pow(2, w) - 1) : w + "-bit number, never negative";
    }
    // signed
    return w <= 32
      ? w + "-bit number, " + -Math.pow(2, w - 1) + " to " + (Math.pow(2, w - 1) - 1)
      : w + "-bit number, can be negative";
  }

  function buildVhdl(data) {
    var usesNumeric = data.ports.some(function (p) {
      return p.type === "unsigned" || p.type === "signed";
    });

    // Line the columns up: names, then modes, then types, then comments.
    var nameLen = 0, modeLen = 0;
    data.ports.forEach(function (p) {
      nameLen = Math.max(nameLen, p.name.length);
      modeLen = Math.max(modeLen, p.mode.length);
    });
    var decls = data.ports.map(function (p, i) {
      var last = i === data.ports.length - 1;
      return padRight(p.name, nameLen) + " : " + padRight(p.mode, modeLen) + " " +
        typeText(p) + (last ? "" : ";");
    });
    var declLen = 0;
    decls.forEach(function (d) { declLen = Math.max(declLen, d.length); });

    var lines = [];
    lines.push("-- Libraries: the IEEE standard logic types");
    lines.push("library ieee;");
    lines.push("use ieee.std_logic_1164.all;  -- std_logic, std_logic_vector");
    if (usesNumeric) lines.push("use ieee.numeric_std.all;     -- signed, unsigned");
    lines.push("");
    lines.push("-- Entity: the outside of your block (its name and its ports)");
    lines.push("entity " + data.entity + " is");
    lines.push("  port (");
    data.ports.forEach(function (p, i) {
      lines.push("    " + padRight(decls[i], declLen) + "  -- " + portComment(p));
    });
    lines.push("  );  -- no semicolon after the last port");
    lines.push("end entity " + data.entity + ";");
    lines.push("");
    lines.push("-- Architecture: the inside of your block (how it behaves)");
    lines.push("architecture " + data.arch + " of " + data.entity + " is");
    lines.push("  -- declare internal signals here");
    lines.push("begin");
    lines.push("  -- your logic goes here");
    lines.push("end architecture " + data.arch + ";");
    return lines.join("\n") + "\n";
  }

  // ---------- Update the page ----------
  function update() {
    var data = readForm();
    statusEl.textContent = "";
    if (data) {
      currentCode = buildVhdl(data);
      output.textContent = currentCode;
      output.classList.remove("is-blocked");
    } else {
      currentCode = "";
      output.textContent = "Your code will appear here once every field is filled in correctly.";
      output.classList.add("is-blocked");
    }
    copyBtn.disabled = !data;
    downloadBtn.disabled = !data;
  }

  // ---------- Copy and Download ----------
  function copyFallback(text) {
    var area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    var worked = false;
    try {
      worked = document.execCommand("copy");
    } catch (e) {}
    document.body.removeChild(area);
    return worked;
  }

  copyBtn.addEventListener("click", function () {
    if (!currentCode) return;
    var done = function () { statusEl.textContent = "Copied!"; };
    var failed = function () {
      if (copyFallback(currentCode)) {
        done();
      } else {
        statusEl.textContent = "Couldn't copy automatically. Select the code and copy it by hand.";
      }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(currentCode).then(done, failed);
    } else {
      failed();
    }
  });

  downloadBtn.addEventListener("click", function () {
    if (!currentCode) return;
    var blob = new Blob([currentCode], { type: "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = entityInput.value.trim() + ".vhd";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    statusEl.textContent = "Downloaded " + link.download;
  });

  // ---------- Events ----------
  // One listener on the whole form handles every field, including new rows.
  var form = document.getElementById("entity-form");
  form.addEventListener("input", function (e) {
    markTouched(e.target);
    update();
  });
  form.addEventListener("change", update);
  form.addEventListener("focusout", function (e) {
    if (e.target.matches("input")) {
      markTouched(e.target);
      update();
    }
  });
  form.addEventListener("submit", function (e) { e.preventDefault(); });

  addPortBtn.addEventListener("click", function () {
    addPortRow({ name: "", mode: "in", type: "std_logic", width: "8" }, true);
    update();
  });

  portList.addEventListener("click", function (e) {
    var btn = e.target.closest(".port-remove");
    if (!btn) return;
    var row = btn.closest(".port-row");
    // Move focus somewhere sensible before the row disappears.
    var next = row.nextElementSibling || row.previousElementSibling;
    row.remove();
    renumberRows();
    if (next) {
      next.querySelector(".port-name").focus();
    } else {
      addPortBtn.focus();
    }
    update();
  });

  // ---------- Start ----------
  EXAMPLE_PORTS.forEach(function (p) { addPortRow(p, false); });
  // The starting values are filled in, so show their errors if a student edits them.
  [entityInput, archInput].forEach(markTouched);
  portList.querySelectorAll("input").forEach(markTouched);
  update();
})();
