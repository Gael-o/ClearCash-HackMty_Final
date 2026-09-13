// model.js
// Modelo de autonomía. Solo aprende de los gastos que el usuario marcó como
// "del negocio": con ellos estima el costo semanal de operación y lo traduce a
// la única métrica que el usuario entiende sin pensar: cuántas semanas puede
// operar sin recibir un peso.
//
// El diseño del incentivo vive aquí. Marcar gastos personales como del negocio
// infla el costo semanal y HUNDE la autonomía, así que exagerar descalifica.
// Y como la línea de crédito se calcula sobre ese mismo costo semanal
// (ver creditBridge.js), esconder gastos del negocio encoge la oferta.
// Decir la verdad es el único punto donde al usuario le va mejor.

const PredictModel = (function () {
  const GOAL_WEEKS = 1.5;

  let workExpenses = [];
  let history = [];

  const numEl = document.getElementById("autonomyNum");
  const footEl = document.getElementById("autonomyFoot");
  const tileEl = document.getElementById("autonomyTile");
  const lineEl = document.getElementById("sparkLine");
  const goalEl = document.getElementById("sparkGoal");

  function weeklyBurn() {
    if (!workExpenses.length) return 0;
    const total = workExpenses.reduce(function (s, t) { return s + t.amount; }, 0);
    return total / workExpenses.length;
  }

  function autonomyWeeks() {
    const burn = weeklyBurn();
    if (!burn) return null;
    return BankAccount.getBalance() / burn;
  }

  function renderSpark() {
    if (history.length < 2) {
      lineEl.setAttribute("d", "");
      goalEl.setAttribute("d", "");
      return;
    }
    const max = Math.max(GOAL_WEEKS * 1.6, Math.max.apply(null, history));
    const stepX = 120 / (history.length - 1);
    const y = function (v) { return 30 - Math.min(v / max, 1) * 26; };

    const d = history.map(function (v, i) {
      return (i ? "L" : "M") + (i * stepX).toFixed(1) + " " + y(v).toFixed(1);
    }).join(" ");

    lineEl.setAttribute("d", d);
    goalEl.setAttribute("d", "M0 " + y(GOAL_WEEKS).toFixed(1) + " L120 " + y(GOAL_WEEKS).toFixed(1));
  }

  function render() {
    const weeks = autonomyWeeks();

    if (weeks === null) {
      numEl.textContent = "—";
      footEl.textContent = "clasifica un gasto del negocio";
      tileEl.classList.remove("ok", "risk");
      renderSpark();
      return;
    }

    numEl.textContent = formatWeeks(weeks);
    numEl.classList.remove("settling");
    void numEl.offsetWidth;
    numEl.classList.add("settling");

    const ok = weeks >= GOAL_WEEKS;
    tileEl.classList.toggle("ok", ok);
    tileEl.classList.toggle("risk", !ok);
    footEl.textContent = ok
      ? "puedes operar sin ingresos"
      : "por debajo de la meta (" + formatWeeks(GOAL_WEEKS) + ")";

    renderSpark();
  }

  function addDataPoint(tx) {
    workExpenses.push(tx);
    const w = autonomyWeeks();
    if (w !== null) history.push(w);
    render();
  }

  function removeDataPoint(tx) {
    const i = workExpenses.indexOf(tx);
    if (i === -1) return;
    workExpenses.splice(i, 1);
    history.pop();
    render();
  }

  render();

  return {
    addDataPoint: addDataPoint,
    removeDataPoint: removeDataPoint,
    getAutonomyWeeks: autonomyWeeks,
    getWeeklyBurn: weeklyBurn,
    GOAL_WEEKS: GOAL_WEEKS
  };
})();
