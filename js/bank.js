// bank.js
// Saldo de la cuenta. El cargo ocurre al recibir la notificación (el dinero ya
// salió), no al clasificar: clasificar no mueve dinero, solo explica en qué se fue.

const BankAccount = (function () {
  let balance = 8450;

  const balanceEl = document.getElementById("bankBalance");
  const lastMoveEl = document.getElementById("lastMove");

  function render() {
    balanceEl.textContent = formatMoney(balance);
  }

  function charge(tx) {
    balance -= tx.amount;
    lastMoveEl.textContent = "último: " + tx.merchant;
    render();
    balanceEl.classList.add("flash");
    setTimeout(function () { balanceEl.classList.remove("flash"); }, 180);
  }

  render();

  return { charge: charge, getBalance: function () { return balance; } };
})();
