const ActivityLog = (function () {
  const listEl = document.getElementById("logList");

  function add(tx, included) {
    const empty = listEl.querySelector(".log-empty");
    if (empty) empty.remove();

    const row = document.createElement("div");
    row.className = "log-item";
    row.innerHTML =
      '<div class="log-left">' +
        '<span class="log-tag ' + (included ? "included" : "excluded") + '">' +
          (included ? "TRABAJO" : "NO TRABAJO") +
        "</span>" +
        "<span>" + tx.merchant + "</span>" +
      "</div>" +
      "<span>" + formatMoney(tx.amount) + "</span>";
    listEl.insertBefore(row, listEl.firstChild);
  }

  return { add: add };
})();