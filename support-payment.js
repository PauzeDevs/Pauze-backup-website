/* Dedicated PAUZE UPI payment page. The supplied image is encoded for ₹99 only. */
(() => {
  const amount = Number(new URLSearchParams(window.location.search).get("amount") || "99");
  if (!Number.isSafeInteger(amount) || amount < 1 || amount > 100000) {
    window.location.replace("index.html#support");
    return;
  }

  const payee = "Pauze";
  const upiId = "prodbyaarav@fam";
  const uri = "upi://pay?" + new URLSearchParams({pa:upiId,pn:payee,am:String(amount),cu:"INR",tn:"Support Pauze"}).toString();
  const amountNode = document.querySelector("#payment-amount");
  const qrNode = document.querySelector("#payment-qr");
  const upiLink = document.querySelector("#payment-upi-link");
  const doneButton = document.querySelector("#payment-done");
  const thanks = document.querySelector("#payment-thanks");
  const timerNode = document.querySelector("#payment-timer");
  const expiryNote = document.querySelector("#payment-expiry-note");
  const expired = document.querySelector("#payment-expired");

  amountNode.textContent = "₹" + amount.toLocaleString("en-IN");
  upiLink.href = uri;
  upiLink.setAttribute("aria-label","Open UPI app to pay ₹" + amount.toLocaleString("en-IN"));

  if (amount === 99) {
    const suppliedQr = document.createElement("img");
    suppliedQr.src = "data:image/png;base64,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";
    suppliedQr.alt = "UPI QR supplied by Pauze for ₹99";
    suppliedQr.decoding = "async";
    qrNode.append(suppliedQr);
  } else if (typeof window.QRCode === "function") {
    new window.QRCode(qrNode,{text:uri,width:250,height:250,colorDark:"#071018",colorLight:"#ffffff",correctLevel:window.QRCode.CorrectLevel.M});
  } else {
    qrNode.textContent = "QR generation is unavailable. Use the Open UPI app link below.";
    qrNode.style.color = "#071018";
    qrNode.style.textAlign = "center";
    qrNode.style.fontSize = "12px";
  }

  let remaining = 180;
  const paintTimer = () => {
    timerNode.textContent = String(Math.floor(remaining/60)).padStart(2,"0") + ":" + String(remaining%60).padStart(2,"0");
  };
  paintTimer();
  const timer = window.setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) {
      window.clearInterval(timer);
      qrNode.replaceChildren();
      timerNode.hidden = true;
      expiryNote.hidden = true;
      expired.hidden = false;
      return;
    }
    paintTimer();
  },1000);

  doneButton.addEventListener("click", () => {
    window.location.href = "support-thanks.html?amount=" + encodeURIComponent(String(amount));
  });
})();
