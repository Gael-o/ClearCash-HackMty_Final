const NotificationFlow = (function () {
  let active = null;
  let dragging = false;
  let startX = 0;
  let currentX = 0;

  const stageArea = document.getElementById("stageArea");
  const placeholderText = document.getElementById("placeholderText");
  const notifBtn = document.getElementById("notifBtn");
  const notifBtnText = document.getElementById("notifBtnText");
  const notifDot = document.getElementById("notifDot");

  function buildTxCard(tx) {
    const card = document.createElement("div");
    card.className = "tx-card";
    card.innerHTML =
      '<div class="stamp save">TRABAJO</div>' +
      '<div class="stamp discard">NO TRABAJO</div>' +
      '<div class="tx-top">' +
        "<div>" +
          '<p class="tx-bank">BBVA &middot; Notificación</p>' +
          '<p class="tx-merchant">' + tx.merchant + "</p>" +
        "</div>" +
        '<span class="tx-amt">&minus;' + formatMoney(tx.amount) + "</span>" +
      "</div>" +
      '<p class="tx-date">Compra con tarjeta de débito</p>' +
      '<div class="tx-hint">' +
        '<span>&larr; trabajo</span>' +
        '<span>personal &rarr;</span>' +
      "</div>";
    return card;
  }

  function attachDrag(card) {
    const saveStamp = card.querySelector(".stamp.save");
    const discardStamp = card.querySelector(".stamp.discard");

    function getX(e) {
      return e.touches && e.touches.length ? e.touches[0].clientX : e.clientX;
    }

    function onMove(e) {
      if (!dragging) return;
      currentX = getX(e) - startX;
      card.style.transform = "translateX(" + currentX + "px) rotate(" + (currentX / 18) + "deg)";
      const t = Math.min(Math.abs(currentX) / 90, 1);
      if (currentX < 0) {
        saveStamp.style.opacity = t;
        discardStamp.style.opacity = 0;
      } else {
        discardStamp.style.opacity = t;
        saveStamp.style.opacity = 0;
      }
      if (e.cancelable) e.preventDefault();
    }

    function onEnd() {
      if (!dragging) return;
      dragging = false;
      card.classList.remove("dragging");
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onEnd);

      if (currentX < -90) {
        resolveTx(true);
      } else if (currentX > 90) {
        resolveTx(false);
      } else {
        card.classList.add("snap-back");
        card.style.transform = "translateX(0) rotate(0)";
        setTimeout(function () { card.classList.remove("snap-back"); }, 300);
      }
      currentX = 0;
    }

    function onStart(e) {
      dragging = true;
      startX = getX(e);
      card.classList.add("dragging");
      if (e.type === "mousedown") {
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onEnd);
      }
    }

    card.addEventListener("touchstart", onStart, { passive: true });
    card.addEventListener("touchmove", onMove, { passive: false });
    card.addEventListener("touchend", onEnd);
    card.addEventListener("touchcancel", onEnd);
    card.addEventListener("mousedown", onStart);
  }

  function resolveTx(saved) {
    if (!active) return;
    const tx = active.tx;
    const card = active.el;
    active = null;

    card.classList.add("resolved", saved ? "save" : "discard");

    if (saved) {
      PredictModel.addDataPoint(tx);
      CreditBridge.evaluate(PredictModel.getBuffer());
    }
    ActivityLog.add(tx, saved);

    setTimeout(function () {
      card.remove();
      placeholderText.style.display = "block";
    }, 350);
  }

  // --- FUNCIÓN START MODIFICADA ---
  // Ahora es 'async' para poder esperar los datos de la base de datos
  async function start() {
    if (active) return;
    notifBtn.disabled = true;
    notifDot.style.display = "inline-block";
    notifBtnText.textContent = "Consultando base de datos..."; // Texto actualizado

    try {
      // 1. Llamamos a tu función de Supabase (asegúrate de que esté disponible en este archivo)
      const datos = await obtenerDatosDesdeSupabase();

      // 2. Si no hay datos, detenemos la animación y avisamos
      if (!datos) {
        alert("No hay cobros registrados en la base de datos.");
        notifBtnText.textContent = "Notificación";
        notifBtn.disabled = false;
        notifDot.style.display = "none";
        return;
      }

      // 3. Transformamos los nombres para no romper tu código original
      const tx = {
        merchant: datos.cobrador,
        amount: datos.monto
      };

      // 4. Continuamos con tu flujo normal
      BankAccount.charge(tx); 

      placeholderText.style.display = "none";
      const card = buildTxCard(tx);
      stageArea.appendChild(card);
      active = { tx: tx, el: card };
      attachDrag(card);

    } catch (error) {
      console.error("Error al procesar la notificación:", error);
    } finally {
      // 5. Restauramos el botón sin importar si hubo éxito o error
      notifDot.style.display = "none";
      notifBtnText.textContent = "Notificación";
      notifBtn.disabled = false;
    }
  }

  return { start: start };
})();