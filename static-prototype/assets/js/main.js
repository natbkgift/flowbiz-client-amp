(function () {
  var body = document.body;

  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
  }

  function closeDrawers() {
    qsa(".is-open").forEach(function (el) {
      if (el.classList.contains("site-nav") || el.classList.contains("filter-panel") || el.classList.contains("admin-sidebar") || el.classList.contains("drawer-backdrop")) {
        el.classList.remove("is-open");
      }
    });
    body.classList.remove("drawer-open");
  }

  qsa("[data-menu-toggle]").forEach(function (button) {
    button.addEventListener("click", function () {
      var target = qs(button.getAttribute("data-menu-toggle"));
      if (target) target.classList.toggle("is-open");
    });
  });

  qsa("[data-filter-toggle]").forEach(function (button) {
    button.addEventListener("click", function () {
      var target = qs(button.getAttribute("data-filter-toggle"));
      var backdrop = qs("[data-drawer-backdrop]");
      if (target) target.classList.toggle("is-open");
      if (backdrop) backdrop.classList.toggle("is-open");
      body.classList.toggle("drawer-open");
    });
  });

  qsa("[data-admin-toggle]").forEach(function (button) {
    button.addEventListener("click", function () {
      var target = qs(button.getAttribute("data-admin-toggle"));
      var backdrop = qs("[data-drawer-backdrop]");
      if (target) target.classList.toggle("is-open");
      if (backdrop) backdrop.classList.toggle("is-open");
      body.classList.toggle("drawer-open");
    });
  });

  qsa("[data-drawer-backdrop]").forEach(function (backdrop) {
    backdrop.addEventListener("click", closeDrawers);
  });

  qsa("[data-gallery]").forEach(function (gallery) {
    var main = qs("[data-gallery-main]", gallery);
    qsa("[data-gallery-thumb]", gallery).forEach(function (thumb) {
      thumb.addEventListener("click", function () {
        if (!main) return;
        var thumbSrc = thumb.getAttribute("data-gallery-thumb");
        if (thumbSrc) main.setAttribute("src", thumbSrc);
        qsa("[data-gallery-thumb]", gallery).forEach(function (x) { x.classList.remove("is-active"); });
        thumb.classList.add("is-active");
      });
    });
  });

  qsa("[data-tab-group]").forEach(function (group) {
    qsa("[data-tab]", group).forEach(function (tab) {
      tab.addEventListener("click", function () {
        var id = tab.getAttribute("data-tab");
        qsa("[data-tab]", group).forEach(function (x) { x.classList.remove("is-active"); });
        qsa("[data-tab-panel]", group).forEach(function (panel) {
          panel.hidden = panel.getAttribute("data-tab-panel") !== id;
        });
        tab.classList.add("is-active");
      });
    });
  });

  function money(value) {
    if (!isFinite(value)) return "THB 0";
    if (value >= 1000000) return "THB " + (value / 1000000).toFixed(1) + "M";
    return "THB " + Math.round(value).toLocaleString("en-US");
  }

  var calc = qs("[data-cost-estimator]");
  if (calc) {
    var price = qs("[data-price]", calc);
    var down = qs("[data-down]", calc);
    var occupancy = qs("[data-occupancy]", calc);
    var adr = qs("[data-adr]", calc);

    function updateCalc() {
      var p = Number(price ? price.value : 0);
      var d = Number(down ? down.value : 0);
      var occ = Number(occupancy ? occupancy.value : 0);
      var nightly = Number(adr ? adr.value : 0);
      var downAmount = p * d / 100;
      var transfer = p * 0.02;
      var legal = 77000;
      var cash = downAmount + transfer + legal;
      var gross = nightly * 365 * occ / 100;
      var net = gross * 0.72;
      var yld = p ? net / p * 100 : 0;

      qsa("[data-out]", calc).forEach(function (out) {
        var key = out.getAttribute("data-out");
        if (key === "cash") out.textContent = money(cash);
        if (key === "yield") out.textContent = yld.toFixed(1) + "%";
        if (key === "net") out.textContent = money(net / 12) + "/mo";
        if (key === "transfer") out.textContent = money(transfer);
      });
    }

    [price, down, occupancy, adr].forEach(function (input) {
      if (input) input.addEventListener("input", updateCalc);
    });
    updateCalc();
  }
})();
