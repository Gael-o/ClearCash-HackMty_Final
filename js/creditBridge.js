// creditBridge.js
// El puente hacia Capital One. No calcula nada del gasto: solo observa el
// modelo de autonomía y decide dos cosas distintas, a propósito.
//
//   ELEGIBILIDAD  -> autonomía sostenida sobre la meta.
//   MONTO         -> costo semanal de operación verificado.
//
// Separarlas es lo que cierra el fraude: exagerar gastos del negocio hunde la
// autonomía y descalifica; esconderlos mantiene la autonomía pero encoge la
// línea. El máximo está en clasificar honestamente.

const CreditBridge = (function () {
  const CYCLES_REQUIRED = 3;
  const WEEKS_OF_OPERATION = 2; // la línea cubre 2 semanas de operación

  let cycles = 0;
  let unlocked = false;

  const cardEl = document.getElementById("creditCard");
  const statusEl = document.getElementById("creditStatus");
  const fillEl = document.getElementById("creditProgressFill");
  const labelEl = document.getElementById("creditProgressLabel");
  const amountEl = document.getElementById("creditAmount");

  const approvalEl = document.getElementById("approval");
  const approvalAmountEl = document.getElementById("approvalAmount");
  const compareWeeksEl = document.getElementById("compareWeeks");
  const approvalCloseEl = document.getElementById("approvalClose");

  approvalCloseEl.addEventListener("click", function () {
    approvalEl.classList.remove("show");
  });

  function offer() {
    return PredictModel.getWeeklyBurn() * WEEKS_OF_OPERATION;
  }

  function render() {
    const pct = Math.min(100, Math.round((cycles / CYCLES_REQUIRED) * 100));
    fillEl.style.width = pct + "%";

    if (unlocked) {
      labelEl.textContent = "línea pre-aprobada, lista para usar";
      amountEl.textContent = formatMoney(offer());
      return;
    }

    labelEl.textContent = cycles + " de " + CYCLES_REQUIRED + " ciclos verificados";
    amountEl.textContent = cycles ? "en camino" : "—";
  }

  function unlock() {
    unlocked = true;
    cardEl.classList.remove("locked");
    cardEl.classList.add("unlocked");
    statusEl.textContent = "Pre-aprobado";
    render();

    const weeks = PredictModel.getAutonomyWeeks();
    approvalAmountEl.textContent = formatMoney(offer());
    compareWeeksEl.textContent = formatWeeks(weeks) + " de autonomía";
    approvalEl.classList.add("show");

    cardEl.classList.add("pulse");
    cardEl.addEventListener("animationend", function () {
      cardEl.classList.remove("pulse");
    }, { once: true });
  }

  // Se llama cada vez que el modelo aprende un gasto del negocio.
  function evaluate() {
    if (unlocked) return;
    const weeks = PredictModel.getAutonomyWeeks();
    if (weeks === null) return;

    cycles = weeks >= PredictModel.GOAL_WEEKS ? cycles + 1 : 0;
    render();

    if (cycles >= CYCLES_REQUIRED) unlock();
  }

  // Se llama cuando el usuario deshace una clasificación de negocio.
  function revoke() {
    if (unlocked) return;
    cycles = Math.max(0, cycles - 1);
    render();
  }

  render();

  return { evaluate: evaluate, revoke: revoke };
})();
