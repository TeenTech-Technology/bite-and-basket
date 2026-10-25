/* Bite & Basket: menu from menu.json, reservation and order forms that write a WhatsApp message.
   Nothing is stored or sent by this page. The customer sends the message themselves. */
(function () {
  "use strict";

  // Used only if menu.json cannot be loaded (keep in step with menu.json).
  var FALLBACK = {
    restaurant: { name: "Bite & Basket", phone: "+260 965 749 929", whatsapp: "260965749929", address: "6 Chindo Road, Woodlands, Lusaka", saturdayTime: "6:30 PM" },
    special: { active: true, label: "Saturday Evening Special", title: "Authentic Indian Vegetarian Buffet", price: null, priceNote: "per person", included: "Soft drinks & water included", footnote: "Freshly prepared with love" },
    ordering: { enabled: true },
    categories: [
      { id: "begin", title: "To begin", items: [{ name: "Puri with Ragda" }, { name: "Crispy Spring Rolls" }] },
      { id: "pots", title: "From the pots", items: [{ name: "Butter Naan" }, { name: "Shahi Paneer" }, { name: "Dal Lehsuni" }, { name: "Jeera Rice" }] },
      { id: "finish", title: "To finish", items: [{ name: "Gulab Jamun / Basundi", choices: ["Gulab Jamun", "Basundi"] }] }
    ]
  };

  var data = FALLBACK;
  var qty = {};          // order quantities by dish name
  var orderables = [];   // flat list of things a customer can order

  function $(id) { return document.getElementById(id); }
  function make(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function icon(id, cls) {
    var s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("class", cls || "ico");
    s.setAttribute("aria-hidden", "true");
    var u = document.createElementNS("http://www.w3.org/2000/svg", "use");
    u.setAttribute("href", "#" + id);
    s.appendChild(u);
    return s;
  }
  function clean(s, max) {
    return String(s == null ? "" : s).replace(/[\u0000-\u001f\u007f<>]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
  }
  function hasPrice(p) { return typeof p === "number" && isFinite(p) && p > 0; }
  function money(n) {
    var whole = Math.round(n) === n;
    return "K" + n.toLocaleString("en-GB", { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 });
  }
  function pad(n) { return String(n).padStart(2, "0"); }
  function iso(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function parseDate(v) { var p = v.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function longDate(v) {
    return parseDate(v).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }
  function clock(v) {
    var p = v.split(":"), h = +p[0], m = p[1];
    return (h % 12 || 12) + ":" + m + " " + (h >= 12 ? "PM" : "AM");
  }
  function reference(kind) {
    var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", out = "", buf = new Uint8Array(4);
    (window.crypto || window.msCrypto).getRandomValues(buf);
    for (var i = 0; i < 4; i++) out += chars[buf[i] % chars.length];
    var d = new Date();
    return "BB-" + kind + "-" + pad(d.getMonth() + 1) + pad(d.getDate()) + "-" + out;
  }
  function waUrl(text) {
    return "https://wa.me/" + data.restaurant.whatsapp + "?text=" + encodeURIComponent(text);
  }

  /* ---------- menu ---------- */
  function flatten() {
    orderables = [];
    data.categories.forEach(function (c) {
      (c.items || []).forEach(function (it) {
        var names = it.choices && it.choices.length ? it.choices : [it.name];
        names.forEach(function (n) {
          orderables.push({ name: n, category: c.title, description: it.description || "", price: hasPrice(it.price) ? it.price : null, soldOut: !!it.soldOut, special: !!it.special });
        });
      });
    });
  }

  function renderMenu() {
    var body = $("menu-body");
    body.textContent = "";
    var sp = data.special || {};
    var head = make("header", "menu-head");
    head.appendChild(make("p", "small", sp.label || "Saturday Evening Special"));
    head.appendChild(make("h3", null, sp.title || "Saturday menu"));
    if (hasPrice(sp.price)) {
      head.appendChild(make("p", "menu-price", money(sp.price) + (sp.priceNote ? " " + sp.priceNote : "")));
    } else {
      head.appendChild(make("p", "small", data.restaurant.saturdayTime + " onwards"));
    }
    body.appendChild(head);

    data.categories.forEach(function (c) {
      if (!c.items || !c.items.length) return;
      var course = make("div", "course");
      course.appendChild(make("h4", null, c.title));
      var ul = make("ul");
      c.items.forEach(function (it) {
        var li = make("li", it.soldOut ? "is-out" : "");
        var line = make("span", "dish");
        line.textContent = it.name;
        li.appendChild(line);
        if (hasPrice(it.price)) li.appendChild(make("span", "dprice", money(it.price)));
        if (it.special) li.appendChild(make("span", "tag tag-special", "This week\u2019s special"));
        if (it.soldOut) li.appendChild(make("span", "tag tag-out", "Sold out"));
        if (it.description) li.appendChild(make("span", "ddesc", it.description));
        ul.appendChild(li);
      });
      course.appendChild(ul);
      body.appendChild(course);
    });

    var foot = make("p", "menu-foot");
    foot.appendChild(document.createTextNode(sp.included || "Soft drinks & water included"));
    if (sp.footnote) { foot.appendChild(make("br")); foot.appendChild(make("em", null, sp.footnote)); }
    body.appendChild(foot);

    var inc = $("menu-included");
    if (inc) inc.lastElementChild.textContent = (sp.included || "Soft drinks and water are included").replace("&", "and") + (/[.]$/.test(sp.included || "") ? "" : ".");

    var price = $("fact-price");
    if (price) price.textContent = hasPrice(sp.price) ? money(sp.price) + (sp.priceNote ? " " + sp.priceNote : "") : "Ask us for this week\u2019s price on WhatsApp";
    var when = $("fact-when");
    if (when) when.textContent = "Every Saturday, from " + data.restaurant.saturdayTime + " onwards";
  }

  /* ---------- order picker ---------- */
  function renderPicker() {
    var list = $("order-list");
    list.textContent = "";
    if (!(data.ordering && data.ordering.enabled === false)) {
      var lastCat = null;
      orderables.forEach(function (o, i) {
        if (o.category !== lastCat) {
          list.appendChild(make("h4", "pick-cat", o.category));
          lastCat = o.category;
        }
        var row = make("div", "pick" + (o.soldOut ? " is-out" : ""));
        var info = make("div", "pick-info");
        var nm = make("span", "pick-name", o.name);
        info.appendChild(nm);
        if (o.soldOut) info.appendChild(make("span", "tag tag-out", "Sold out"));
        else if (o.special) info.appendChild(make("span", "tag tag-special", "Special"));
        if (hasPrice(o.price)) info.appendChild(make("span", "pick-price", money(o.price) + " each"));
        if (o.description) info.appendChild(make("span", "pick-desc", o.description));
        row.appendChild(info);

        var step = make("div", "step");
        var minus = make("button", "step-btn"); minus.type = "button";
        minus.setAttribute("aria-label", "Remove one " + o.name); minus.appendChild(icon("i-minus"));
        var out = make("output", "step-n", "0"); out.id = "q-" + i; out.setAttribute("aria-label", "Quantity of " + o.name);
        var plus = make("button", "step-btn"); plus.type = "button";
        plus.setAttribute("aria-label", "Add one " + o.name); plus.appendChild(icon("i-plus"));
        if (o.soldOut) { minus.disabled = true; plus.disabled = true; }
        minus.addEventListener("click", function () { setQty(i, -1); });
        plus.addEventListener("click", function () { setQty(i, 1); });
        step.appendChild(minus); step.appendChild(out); step.appendChild(plus);
        row.appendChild(step);
        list.appendChild(row);
      });
    }
    qty = {};
    updateSummary();
  }

  function setQty(i, d) {
    var o = orderables[i];
    var n = Math.max(0, Math.min(20, (qty[o.name] || 0) + d));
    if (n) qty[o.name] = n; else delete qty[o.name];
    $("q-" + i).textContent = String(n);
    var row = $("q-" + i).closest(".pick");
    row.classList.toggle("has", n > 0);
    updateSummary();
  }

  function chosen() {
    return orderables.filter(function (o) { return qty[o.name]; }).map(function (o) { return { o: o, n: qty[o.name] }; });
  }
  function totals(items) {
    var allPriced = items.length > 0, sum = 0;
    items.forEach(function (x) { if (hasPrice(x.o.price)) sum += x.o.price * x.n; else allPriced = false; });
    return allPriced ? sum : null;
  }

  function updateSummary() {
    var box = $("osum");
    box.textContent = "";
    var items = chosen();
    if (!items.length) { box.appendChild(make("p", "osum-empty", "Nothing chosen yet. Tap the plus button beside a dish.")); return; }
    var count = items.reduce(function (a, x) { return a + x.n; }, 0);
    box.appendChild(make("p", "osum-title", "Your order (" + count + (count === 1 ? " portion" : " portions") + ")"));
    var ul = make("ul", "osum-list");
    items.forEach(function (x) {
      var li = make("li");
      li.appendChild(make("span", null, x.n + " \u00d7 " + x.o.name));
      if (hasPrice(x.o.price)) li.appendChild(make("span", "osum-amt", money(x.o.price * x.n)));
      ul.appendChild(li);
    });
    box.appendChild(ul);
    var t = totals(items);
    box.appendChild(make("p", "osum-total", t != null ? "Total: " + money(t) : "Price to be confirmed by the restaurant"));
  }

  /* ---------- confirmation panel ---------- */
  function showDone(form, panel, o) {
    panel.textContent = "";
    var badge = make("span", "done-badge"); badge.appendChild(icon("i-check"));
    panel.appendChild(badge);
    var h = make("h3", null, "Your message is ready");
    h.tabIndex = -1;
    panel.appendChild(h);
    panel.appendChild(make("p", "done-lead", "One more step: tap the green button, WhatsApp opens with this message, then press send. Until you do, we have not received anything."));
    var refBox = make("div", "refbox");
    refBox.appendChild(make("span", "refbox-k", o.kind + " reference"));
    refBox.appendChild(make("span", "refbox-v", o.ref));
    panel.appendChild(refBox);
    var pre = make("pre", "msg", o.msg);
    pre.setAttribute("aria-label", "Message preview");
    panel.appendChild(pre);

    var actions = make("div", "done-actions");
    var send = make("a", "btn btn-wa btn-block");
    send.href = waUrl(o.msg); send.target = "_blank"; send.rel = "noopener";
    send.id = o.id + "-send";
    send.appendChild(icon("i-wa")); send.appendChild(make("span", null, "Send on WhatsApp"));
    actions.appendChild(send);
    var copy = make("button", "btn btn-ghost btn-block"); copy.type = "button";
    copy.appendChild(icon("i-copy")); var cl = make("span", null, "Copy message"); copy.appendChild(cl);
    copy.addEventListener("click", function () {
      function ok() { cl.textContent = "Copied"; setTimeout(function () { cl.textContent = "Copy message"; }, 2000); }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(o.msg).then(ok, fallbackCopy);
      else fallbackCopy();
      function fallbackCopy() {
        var ta = document.createElement("textarea"); ta.value = o.msg; ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy"); ok(); } catch (e) { cl.textContent = "Press and hold the text to copy"; }
        document.body.removeChild(ta);
      }
    });
    actions.appendChild(copy);
    panel.appendChild(actions);
    var back = make("button", "linkbtn", "Change my details"); back.type = "button";
    back.addEventListener("click", function () { panel.hidden = true; form.hidden = false; form.scrollIntoView({ block: "start" }); });
    panel.appendChild(back);
    var tel = make("p", "done-tel");
    tel.appendChild(document.createTextNode("Prefer to talk? Call "));
    var a = make("a", null, data.restaurant.phone); a.href = "tel:" + data.restaurant.phone.replace(/[^+\d]/g, "");
    tel.appendChild(a); tel.appendChild(document.createTextNode("."));
    panel.appendChild(tel);

    form.hidden = true; panel.hidden = false;
    panel.scrollIntoView({ block: "start" });
    h.focus({ preventScroll: true });
  }

  function validPhone(v) {
    return /^[+\d\s()\-]+$/.test(v) && v.replace(/\D/g, "").length >= 9 && v.replace(/\D/g, "").length <= 15;
  }
  function fail(form, errEl, msg, field) {
    errEl.textContent = msg; errEl.hidden = false;
    if (field) { field.setAttribute("aria-invalid", "true"); field.focus(); }
  }
  function resetErrors(form, errEl) {
    errEl.hidden = true;
    Array.prototype.forEach.call(form.querySelectorAll("[aria-invalid]"), function (e) { e.removeAttribute("aria-invalid"); });
  }

  /* ---------- reservation ---------- */
  function initReserve() {
    var form = $("rform"), done = $("r-done"), err = $("r-error"), hint = $("r-hint");
    var dateEl = $("r-date");
    var today = new Date(), t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    var next = new Date(t0); next.setDate(next.getDate() + ((6 - next.getDay() + 7) % 7));
    dateEl.min = iso(t0); dateEl.value = iso(next);
    function checkDate() {
      if (!dateEl.value) { hint.textContent = "The buffet is on Saturdays."; hint.className = "hint"; return; }
      if (parseDate(dateEl.value).getDay() === 6) { hint.textContent = "A Saturday, lovely. The buffet starts at " + data.restaurant.saturdayTime + "."; hint.className = "hint"; }
      else { hint.textContent = "The buffet is on Saturdays. You can still send this and we will tell you what we can do on other days."; hint.className = "hint warn"; }
    }
    dateEl.addEventListener("change", checkDate); checkDate();

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      resetErrors(form, err);
      var name = clean($("r-name").value, 60), phone = clean($("r-phone").value, 20), notes = clean($("r-notes").value, 300);
      var people = parseInt($("r-people").value, 10), date = dateEl.value, time = $("r-time").value;
      if (!name) return fail(form, err, "Please tell us your name.", $("r-name"));
      if (!validPhone(phone)) return fail(form, err, "Please enter a phone number we can reach you on, for example 097 123 4567.", $("r-phone"));
      if (!people || people < 1 || people > 60) return fail(form, err, "Please enter how many people, from 1 to 60. For larger groups, please call us.", $("r-people"));
      if (!date || parseDate(date) < t0) return fail(form, err, "Please choose today or a date in the future.", dateEl);
      if (!/^\d{2}:\d{2}$/.test(time)) return fail(form, err, "Please choose a time.", $("r-time"));
      var ref = reference("R");
      var lines = [
        "Hello " + data.restaurant.name + ", I would like to reserve a table.", "",
        "Reference: " + ref,
        "Name: " + name,
        "Phone: " + phone,
        "People: " + people,
        "Date: " + longDate(date),
        "Time: " + clock(time)
      ];
      if (notes) lines.push("Notes: " + notes);
      lines.push("", "Please confirm if you have space. Thank you.");
      showDone(form, done, { id: "r", kind: "Booking", ref: ref, msg: lines.join("\n") });
    });
  }

  /* ---------- order ---------- */
  function initOrder() {
    var form = $("oform"), done = $("o-done"), err = $("o-error");
    var addrWrap = $("o-addr-wrap"), addr = $("o-address");
    Array.prototype.forEach.call(form.querySelectorAll("input[name=mode]"), function (r) {
      r.addEventListener("change", function () {
        var delivery = form.mode.value === "delivery";
        addrWrap.hidden = !delivery;
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      resetErrors(form, err);
      var items = chosen();
      if (!items.length) return fail(form, err, "Please choose at least one dish first.", null);
      var delivery = form.mode.value === "delivery";
      var name = clean($("o-name").value, 60), phone = clean($("o-phone").value, 20), notes = clean($("o-notes").value, 300);
      var when = clean($("o-when").value, 60), address = clean(addr.value, 200);
      if (delivery && !address) return fail(form, err, "Please add the delivery address.", addr);
      if (!name) return fail(form, err, "Please tell us your name.", $("o-name"));
      if (!validPhone(phone)) return fail(form, err, "Please enter a phone number we can reach you on, for example 097 123 4567.", $("o-phone"));
      var ref = reference("O");
      var lines = ["Hello " + data.restaurant.name + ", I would like to place an order.", "",
        "Reference: " + ref,
        "Name: " + name,
        "Phone: " + phone,
        delivery ? "Delivery to: " + address : "Pickup: I will collect"];
      if (when) lines.push("When: " + when);
      lines.push("", "Order:");
      items.forEach(function (x) { lines.push("- " + x.n + " x " + x.o.name + (hasPrice(x.o.price) ? " (" + money(x.o.price * x.n) + ")" : "")); });
      var t = totals(items);
      lines.push("", t != null ? "Total: " + money(t) : "Price: please confirm");
      if (notes) lines.push("Notes: " + notes);
      lines.push("", "Please confirm what is available. Thank you.");
      showDone(form, done, { id: "o", kind: "Order", ref: ref, msg: lines.join("\n") });
    });
  }

  /* ---------- start ---------- */
  function start(d) {
    data = d;
    flatten();
    renderMenu();
    renderPicker();
    if (data.ordering && data.ordering.enabled === false) {
      var s = $("order"); if (s) s.hidden = true;
      var ho = $("hero-order"); if (ho) ho.hidden = true;
    }
  }

  initReserve();
  initOrder();

  var loaded = false;
  fetch("menu.json", { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw new Error("menu"); return r.json(); })
    .then(function (d) {
      if (!d || !Array.isArray(d.categories) || !d.restaurant) throw new Error("shape");
      d.special = d.special || {}; d.ordering = d.ordering || {};
      loaded = true; start(d);
    })
    .catch(function () { if (!loaded) start(FALLBACK); });

  // tuck the floating button away while a form is on screen
  var floatBtn = $("wa-float");
  if ("IntersectionObserver" in window && floatBtn) {
    var on = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { on[en.target.id] = en.isIntersecting; });
      floatBtn.classList.toggle("hide", !!(on.reserve || on.order || on.visit));
    }, { threshold: 0.2 });
    ["reserve", "order", "visit"].forEach(function (id) { var el = $(id); if (el) io.observe(el); });
  }
})();
