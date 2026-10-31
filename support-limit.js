/* Enforce the custom UPI contribution range on the support page. */
(() => {
  const section = document.querySelector("#support");
  if (!section) return;
  const input = section.querySelector("#support-custom");
  const button = section.querySelector("#support-generate");
  if (!input || !button) return;

  const minimum = 10;
  const maximum = 10000;
  input.min = String(minimum);
  input.max = String(maximum);
  input.step = "1";

  button.addEventListener("click", (event) => {
    const raw = input.value.trim();
    if (!raw) return; // Let the existing handler use the selected preset.
    const amount = Number(raw);
    if (!Number.isSafeInteger(amount) || amount < minimum || amount > maximum) {
      event.preventDefault();
      event.stopImmediatePropagation();
      input.setCustomValidity("Enter a whole amount between ₹10 and ₹10,000.");
      input.reportValidity();
      input.setCustomValidity("");
      input.focus();
      return;
    }
    event.stopImmediatePropagation();
    window.location.href = "/support-payment.html?amount=" + encodeURIComponent(String(amount));
  }, true);
})();