// log.js
// Historial de clasificaciones. Cada fila se puede deshacer: el gasto regresa a
// la fila de pendientes y el modelo olvida ese dato. Un dato mal clasificado
// nunca se queda dentro de la decisión de crédito.

const ActivityLog = (function () {
  const listEl = document.getElementById("logList");

  function add(tx, isWork) {
    const empty = listEl.querySelector(".log-empty");
    if (empty) empty.remove();

    const row = document.createElement("div");
    row.className = "log-item";

    const left = document.createElement("div");
    left.className = "log-left";
    left.innerHTML =
      '<span class="log-tag ' + (isWork ? "work" : "personal") + '">' +
        (isWork ? "NEGOCIO" : "PERSONAL") +
      "</span>" +
      '<span class="log-merchant"></span>';
    left.querySelector(".log-merchant").textContent = tx.merchant;

    const right = document.createElement("div");
    right.className = "log-right";

    const amt = document.createElement("span");
    amt.className = "log-amt";
    amt.textContent = formatMoney(tx.amount);

    const undo = document.createElement("button");
    undo.className = "log-undo";
    undo.title = "Volver a clasificar";
    undo.setAttribute("aria-label", "Volver a clasificar " + tx.merchant);
    undo.textContent = "↺";
    undo.addEventListener("click", function () {
      if (isWork) {
        PredictModel.removeDataPoint(tx);
        CreditBridge.revoke();
      }
      row.classList.add("undoing");
      setTimeout(function () {
        row.remove();
        if (!listEl.querySelector(".log-item")) {
          const p = document.createElement("p");
          p.className = "log-empty";
          p.textContent = "Aquí aparecen los gastos que ya clasificaste.";
          listEl.appendChild(p);
        }
      }, 200);
      NotificationFlow.requeue(tx);
    });

    right.appendChild(amt);
    right.appendChild(undo);
    row.appendChild(left);
    row.appendChild(right);
    listEl.insertBefore(row, listEl.firstChild);
  }

  return { add: add };
})();
