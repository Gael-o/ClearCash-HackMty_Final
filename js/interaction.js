// interaction.js
// Las notificaciones llegan solas, como llegarían en el teléfono: nadie
// presiona un botón para *recibir* un cobro. La sesión trae una cola fija
// (ver DEMO_SIZE) para que el flujo tenga principio y fin, sin bucle infinito.

const NotificationFlow = (function () {
  const FIRST_DELAY = 1600;
  const NEXT_DELAY = 1400;
  const SWIPE_THRESHOLD = 90;

  let queue = [];
  let active = null;
  let timer = null;
  let dragging = false;
  let startX = 0;
  let currentX = 0;

  const stageArea = document.getElementById("stageArea");
  const placeholderText = document.getElementById("placeholderText");
  const queueBadge = document.getElementById("queueBadge");

  function renderBadge() {
    const pending = queue.length + (active ? 1 : 0);
    if (!pending) {
      queueBadge.textContent = "todo clasificado";
      queueBadge.className = "queue-badge done";
      return;
    }
    queueBadge.textContent = pending + (pending === 1 ? " pendiente" : " pendientes");
    queueBadge.className = "queue-badge";
  }

  function buildTxCard(tx) {
    const card = document.createElement("div");
    card.className = "tx-card entering";
    card.innerHTML =
      '<div class="stamp work">NEGOCIO</div>' +
      '<div class="stamp personal">PERSONAL</div>' +
      '<p class="tx-bank">BBVA · Notificación</p>' +
      '<p class="tx-merchant"></p>' +
      '<p class="tx-amt"></p>' +
      '<p class="tx-date">Compra con tarjeta de débito</p>';
    card.querySelector(".tx-merchant").textContent = tx.merchant;
    card.querySelector(".tx-amt").textContent = "−" + formatMoney(tx.amount);
    return card;
  }

  function attachDrag(card) {
    const workStamp = card.querySelector(".stamp.work");
    const personalStamp = card.querySelector(".stamp.personal");

    function getX(e) {
      return e.touches && e.touches.length ? e.touches[0].clientX : e.clientX;
    }

    function onMove(e) {
      if (!dragging) return;
      currentX = getX(e) - startX;
      card.style.transform = "translateX(" + currentX + "px) rotate(" + (currentX / 18) + "deg)";
      const t = Math.min(Math.abs(currentX) / SWIPE_THRESHOLD, 1);
      workStamp.style.opacity = currentX < 0 ? t : 0;
      personalStamp.style.opacity = currentX > 0 ? t : 0;
      if (e.cancelable) e.preventDefault();
    }

    function onEnd() {
      if (!dragging) return;
      dragging = false;
      card.classList.remove("dragging");
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onEnd);

      if (currentX < -SWIPE_THRESHOLD) {
        resolve(true);
      } else if (currentX > SWIPE_THRESHOLD) {
        resolve(false);
      } else {
        card.classList.add("snap-back");
        card.style.transform = "translateX(0) rotate(0)";
        workStamp.style.opacity = 0;
        personalStamp.style.opacity = 0;
        setTimeout(function () { card.classList.remove("snap-back"); }, 300);
      }
      currentX = 0;
    }

    function onStart(e) {
      dragging = true;
      startX = getX(e);
      currentX = 0;
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

  function resolve(isWork) {
    if (!active) return;
    const tx = active.tx;
    const card = active.el;
    active = null;

    card.classList.add("resolved", isWork ? "work" : "personal");

    if (isWork) {
      PredictModel.addDataPoint(tx);
      CreditBridge.evaluate();
    }
    ActivityLog.add(tx, isWork);

    setTimeout(function () {
      card.remove();
      placeholderText.style.display = "block";
    }, 320);

    renderBadge();
    scheduleNext(NEXT_DELAY);
  }

  function present(tx) {
    if (!tx._charged) {
      BankAccount.charge(tx);
      tx._charged = true;
    }
    placeholderText.style.display = "none";
    const card = buildTxCard(tx);
    stageArea.appendChild(card);
    requestAnimationFrame(function () { card.classList.remove("entering"); });
    active = { tx: tx, el: card };
    attachDrag(card);
    renderBadge();
  }

  function scheduleNext(delay) {
    clearTimeout(timer);
    if (active || !queue.length) {
      if (!active && !queue.length) {
        placeholderText.textContent = "Listo. Clasificaste todos tus movimientos.";
        renderBadge();
      }
      return;
    }
    timer = setTimeout(function () {
      if (active) return;
      present(queue.shift());
    }, delay);
  }

  // El gasto vuelve a la fila cuando el usuario deshace su clasificación.
  function requeue(tx) {
    queue.unshift(tx);
    renderBadge();
    scheduleNext(400);
  }

  async function init() {
    placeholderText.textContent = "Conectando con tu cuenta…";
    queue = await cargarColaDeGastos();

    if (!queue.length) {
      placeholderText.textContent = "No hay movimientos en la base de datos.";
      renderBadge();
      return;
    }

    placeholderText.textContent = "Esperando movimientos de tu cuenta…";
    renderBadge();
    scheduleNext(FIRST_DELAY);
  }

  return { init: init, requeue: requeue };
})();
