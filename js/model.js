// model.js
// Modelo de costo de operación. Solo aprende de los gastos que el usuario marcó
// como "del negocio" y estima cuánto le cuesta operar. No intenta adivinar a qué
// se dedica: no lo necesita, y tampoco inventa una unidad de tiempo —la tabla de
// gastos no trae fechas, así que cualquier "por semana" sería un número sacado
// de la nada. El costo es el promedio de lo que el propio usuario confirmó.
//
// La cobertura (saldo ÷ costo) no se le muestra al usuario: es la regla de
// elegibilidad que consume creditBridge.js. Ahí vive el incentivo: inflar los
// gastos del negocio hunde la cobertura y descalifica, mientras que esconderlos
// mantiene la cobertura pero encoge la línea, que se calcula sobre este mismo
// costo. Decir la verdad es el único punto donde al usuario le va mejor.

const PredictModel = (function () {
  const COVERAGE_GOAL = 1.5;

  let workExpenses = [];
  let history = [];

  const numEl = document.getElementById("autonomyNum");
  const footEl = document.getElementById("autonomyFoot");
  const tileEl = document.getElementById("autonomyTile");
  const lineEl = document.getElementById("sparkLine");
  const goalEl = document.getElementById("sparkGoal");

  function operatingCost() {
    if (!workExpenses.length) return 0;
    const total = workExpenses.reduce(function (s, t) { return s + t.amount; }, 0);
    return total / workExpenses.length;
  }

  function coverage() {
    const cost = operatingCost();
    if (!cost) return null;
    return BankAccount.getBalance() / cost;
  }

  // La línea muestra cómo se acomoda la estimación conforme entran más datos.
  function renderSpark() {
    if (history.length < 2) {
      lineEl.setAttribute("d", "");
      goalEl.setAttribute("d", "");
      return;
    }
    const max = Math.max.apply(null, history) * 1.15;
    const stepX = 120 / (history.length - 1);
    const y = function (v) { return 30 - Math.min(v / max, 1) * 26; };

    lineEl.setAttribute("d", history.map(function (v, i) {
      return (i ? "L" : "M") + (i * stepX).toFixed(1) + " " + y(v).toFixed(1);
    }).join(" "));

    const last = history[history.length - 1];
    goalEl.setAttribute("d", "M0 " + y(last).toFixed(1) + " L120 " + y(last).toFixed(1));
  }

  function render() {
    const cost = operatingCost();

    if (!cost) {
      numEl.textContent = "—";
      footEl.textContent = "clasifica un gasto del negocio";
      tileEl.classList.remove("ok");
      renderSpark();
      return;
    }

    numEl.textContent = formatMoney(cost);
    numEl.classList.remove("settling");
    void numEl.offsetWidth;
    numEl.classList.add("settling");

    tileEl.classList.add("ok");
    footEl.textContent = "según " + workExpenses.length +
      (workExpenses.length === 1 ? " gasto que confirmaste" : " gastos que confirmaste");

    renderSpark();
  }

  function addDataPoint(tx) {
    workExpenses.push(tx);
    history.push(operatingCost());
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
    getCoverage: coverage,
    getOperatingCost: operatingCost,
    getSampleSize: function () { return workExpenses.length; },
    COVERAGE_GOAL: COVERAGE_GOAL
  };
})();
