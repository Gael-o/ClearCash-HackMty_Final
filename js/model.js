// model.js
// El modelo de predictibilidad. Guarda únicamente las transacciones que el
// usuario aprueba (swipe izquierda) y, con cada dato nuevo, recalcula el
// colchón recomendado. En vez de mostrar una "certeza" aparte, el número
// mismo se ajusta y mostramos cuánto se movió respecto al cálculo anterior.

const PredictModel = (function () {
  let savedData = [];
  let previousPrediction = null;

  const predictionEl = document.getElementById("modelPrediction");
  const adjustRowEl = document.getElementById("adjustRow");
  const adjustArrowEl = document.getElementById("adjustArrow");
  const adjustValEl = document.getElementById("adjustVal");

  function computeRecommendedBuffer() {
    const workData = savedData.filter(function (t) { return t.category === "trabajo"; });
    const n = savedData.length;
    const avgWork = workData.length
      ? workData.reduce(function (s, t) { return s + t.amount; }, 0) / workData.length
      : savedData.reduce(function (s, t) { return s + t.amount; }, 0) / n;

    const weeklyPrediction = avgWork * 5;
    const recommendedBuffer = weeklyPrediction * 3;
    return { weeklyPrediction: weeklyPrediction, recommendedBuffer: recommendedBuffer };
  }

  function renderAdjustment(recommendedBuffer) {
    if (previousPrediction === null) {
      adjustRowEl.className = "adjust-row flat";
      adjustArrowEl.textContent = "";
      adjustValEl.textContent = "primer cálculo";
      return;
    }
    const delta = recommendedBuffer - previousPrediction;
    if (Math.abs(delta) < 1) {
      adjustRowEl.className = "adjust-row flat";
      adjustArrowEl.textContent = "";
      adjustValEl.textContent = "sin cambios";
    } else if (delta > 0) {
      adjustRowEl.className = "adjust-row up";
      adjustArrowEl.textContent = "▲";
      adjustValEl.textContent = "+" + formatMoney(delta);
    } else {
      adjustRowEl.className = "adjust-row down";
      adjustArrowEl.textContent = "▼";
      adjustValEl.textContent = "\u2212" + formatMoney(Math.abs(delta));
    }
  }

  function recalc() {
    const n = savedData.length;

    if (n === 0) {
      predictionEl.textContent = "—";
      adjustRowEl.className = "adjust-row flat";
      adjustArrowEl.textContent = "";
      adjustValEl.textContent = "sin datos aún";
      previousPrediction = null;
      return;
    }

    const result = computeRecommendedBuffer();

    predictionEl.textContent = formatMoney(result.recommendedBuffer);
    predictionEl.classList.remove("settling");
    void predictionEl.offsetWidth; // reinicia la animación
    predictionEl.classList.add("settling");

    renderAdjustment(result.recommendedBuffer);
    previousPrediction = result.recommendedBuffer;
  }

  // Único punto de entrada: se le pasa una transacción ya aprobada por el usuario.
  function addDataPoint(tx) {
    savedData.push(tx);
    recalc();
  }

  recalc();

  return {
    addDataPoint: addDataPoint,
    getBuffer: function () { return previousPrediction; }
  };
})();