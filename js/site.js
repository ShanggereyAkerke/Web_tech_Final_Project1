/* Shared FAQ, newsletter, palette and clock interactions. */
"use strict";

function showError(input, message) {
  document.getElementById(input.id + "-error").textContent = message;
  input.setAttribute("aria-invalid", String(Boolean(message)));
  input.classList.toggle("is-invalid", Boolean(message));
  return !message;
}

function newsletterEmailError(email) {
  if (!email) return "Enter your email address.";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Enter a valid email, such as alex@example.com.";
  }
  return "";
}

// CSS animates the row while JS controls open/closed state.
document.querySelectorAll(".faq-toggle").forEach((button) => {
  const answer = document.getElementById(button.getAttribute("aria-controls"));
  answer.classList.add("is-collapsed");
  answer.inert = true;
  answer.setAttribute("aria-hidden", "true");
  button.addEventListener("click", () => {
    const open = button.getAttribute("aria-expanded") !== "true";
    button.setAttribute("aria-expanded", String(open));
    button.querySelector("span").textContent = open ? "−" : "+";
    answer.classList.toggle("is-collapsed", !open);
    answer.inert = !open;
    answer.setAttribute("aria-hidden", String(!open));
  });
});

// The dialog supplies keyboard focus containment and Escape support.
const dialog = document.getElementById("subscribe-dialog");
if (dialog) {
  let opener;
  document.querySelectorAll("[data-open-popup]").forEach((button) => {
    button.addEventListener("click", () => {
      opener = button;
      dialog.showModal();
      document.body.classList.add("popup-open");
      document.getElementById("subscriber-email").focus();
    });
  });
  dialog.querySelector("[data-close-popup]").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog &&
        (event.clientX < bounds.left || event.clientX > bounds.right ||
         event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
  });
  const form = document.getElementById("subscribe-form");
  const email = document.getElementById("subscriber-email");
  const status = document.getElementById("subscribe-status");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (form.getAttribute("aria-busy") === "true") return;
    status.textContent = "";
    status.classList.remove("success");

    const address = email.value.trim().toLowerCase();
    if (!showError(email, newsletterEmailError(address))) {
      email.focus();
      return;
    }

    const saveEmail = () => {
      if (!dialog.open) return;
      const key = "foryou-newsletter-v1";
      try {
        const saved = JSON.parse(localStorage.getItem(key) || "[]");
        if (!Array.isArray(saved)) throw new Error("Invalid address list");
        if (saved.includes(address)) {
          status.textContent = "This email is already saved on this device.";
        } else {
          localStorage.setItem(key, JSON.stringify([...saved, address]));
          status.textContent = "Your email has been saved on this device.";
        }
        status.classList.add("success");
        form.reset();
      } catch (_) {
        status.textContent = "We couldn't save your email. Allow local storage and try again.";
      }
    };

    if (window.ForYouUX) window.ForYouUX.submit(form, saveEmail);
    else saveEmail();
  });
  email.addEventListener("input", () => {
    status.textContent = "";
    status.classList.remove("success");
    if (email.getAttribute("aria-invalid") === "true") {
      showError(email, newsletterEmailError(email.value.trim()));
    }
  });
  dialog.addEventListener("close", () => {
    document.body.classList.remove("popup-open");
    form.reset();
    showError(email, "");
    status.textContent = "";
    status.classList.remove("success");
    opener?.focus();
  });
}

// Independent background palettes for light and dark themes.
const colourButton = document.getElementById("change-colour");
if (colourButton) {
  const palettes = {
    light: [{ name: "White", value: "#ffffff" }, { name: "Mist", value: "#f3f3f3" }, { name: "Silver", value: "#e7e7e7" }],
    dark: [{ name: "Charcoal", value: "#171717" }, { name: "Graphite", value: "#242424" }, { name: "Midnight", value: "#101820" }]
  };
  const selected = { light: 0, dark: 0 };
  try {
    const saved = JSON.parse(localStorage.getItem("foryou-backgrounds") || "{}");
    ["light", "dark"].forEach(function (mode) { if (Number.isInteger(saved[mode]) && saved[mode] >= 0 && saved[mode] < 3) selected[mode] = saved[mode]; });
  } catch (_) { /* Defaults work when storage is unavailable. */ }
  function applyBackground() {
    const mode = document.documentElement.getAttribute("data-bs-theme") === "dark" ? "dark" : "light";
    const color = palettes[mode][selected[mode]];
    document.body.style.setProperty(mode === "dark" ? "--fy-selected-dark" : "--fy-selected-paper", color.value);
    document.getElementById("colour-name").textContent = color.name;
    colourButton.title = "Change background (" + color.name + ")";
  }
  colourButton.addEventListener("click", function () {
    const mode = document.documentElement.getAttribute("data-bs-theme") === "dark" ? "dark" : "light";
    selected[mode] = (selected[mode] + 1) % palettes[mode].length;
    try { localStorage.setItem("foryou-backgrounds", JSON.stringify(selected)); } catch (_) { /* Selection remains usable. */ }
    applyBackground();
  });
  window.addEventListener("foryou:theme", applyBackground);
  applyBackground();
}

// Task 5: use the visitor's local Date, and update once every second.
const clocks = document.querySelectorAll("[data-clock]");
if (clocks.length) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "long", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true
  });
  function updateClock() {
    const now = new Date();
    clocks.forEach((clock) => {
      clock.textContent = formatter.format(now);
      clock.dateTime = now.toISOString();
    });
  }
  updateClock();
  setInterval(updateClock, 1000);
}
