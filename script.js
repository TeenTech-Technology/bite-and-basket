(function () {
  var NUMBER = "260965749929";
  var form = document.getElementById("rform");
  var nameEl = document.getElementById("f-name");
  var peopleEl = document.getElementById("f-people");
  var dateEl = document.getElementById("f-date");
  var hint = document.getElementById("f-hint");

  function iso(d) {
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
  }
  function parse(v) {
    var p = v.split("-");
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }

  // default to the coming Saturday
  var today = new Date();
  var next = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  next.setDate(next.getDate() + ((6 - next.getDay() + 7) % 7));
  dateEl.min = iso(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  dateEl.value = iso(next);

  function checkDate() {
    if (!dateEl.value) { hint.textContent = "The buffet is on Saturdays."; hint.className = "hint"; return; }
    var d = parse(dateEl.value);
    if (d.getDay() === 6) {
      hint.textContent = "A Saturday, lovely.";
      hint.className = "hint";
    } else {
      hint.textContent = "The buffet is on Saturdays. You can still send this and ask us about other days.";
      hint.className = "hint warn";
    }
  }
  dateEl.addEventListener("change", checkDate);
  checkDate();

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var ok = true;
    [nameEl, peopleEl, dateEl].forEach(function (el) { el.removeAttribute("aria-invalid"); });
    if (!nameEl.value.trim()) { nameEl.setAttribute("aria-invalid", "true"); ok = false; }
    var n = parseInt(peopleEl.value, 10);
    if (!n || n < 1) { peopleEl.setAttribute("aria-invalid", "true"); ok = false; }
    if (!dateEl.value) { dateEl.setAttribute("aria-invalid", "true"); ok = false; }
    if (!ok) {
      hint.textContent = "Please fill in your name, how many of you, and a date.";
      hint.className = "hint warn";
      var bad = form.querySelector("[aria-invalid=true]");
      if (bad) bad.focus();
      return;
    }
    var when = parse(dateEl.value).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    var msg = "Hello Bite & Basket, I'd like to reserve a table for " + n + (n === 1 ? " person" : " people") +
      " on " + when + ". My name is " + nameEl.value.trim() + ". Could you let me know this week's price and confirm? Thank you.";
    var url = "https://wa.me/" + NUMBER + "?text=" + encodeURIComponent(msg);
    window.open(url, "_blank", "noopener");
  });

  // tuck the floating button away while the form is on screen
  var float = document.getElementById("wa-float");
  var reserve = document.getElementById("reserve");
  if ("IntersectionObserver" in window && float && reserve) {
    new IntersectionObserver(function (entries) {
      float.classList.toggle("hide", entries[0].isIntersecting);
    }, { threshold: 0.35 }).observe(reserve);
  }
})();
