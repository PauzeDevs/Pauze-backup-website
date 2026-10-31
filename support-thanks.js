(() => {
  const params = new URLSearchParams(window.location.search);
  const rawAmount = Number(params.get("amount") || "99");
  const amount = Number.isSafeInteger(rawAmount) && rawAmount >= 1 && rawAmount <= 100000 ? rawAmount : 99;
  document.querySelector("#thanks-amount").textContent = "₹" + amount.toLocaleString("en-IN");
  const countdownNode = document.querySelector("#thanks-countdown");
  let remaining = 20;
  countdownNode.textContent = String(remaining);
  const timer = window.setInterval(() => {
    remaining -= 1;
    countdownNode.textContent = String(remaining);
    if (remaining <= 0) {
      window.clearInterval(timer);
      window.close();
      window.setTimeout(() => window.location.replace("index.html#top"), 150);
    }
  }, 1000);
})();