// data.js
// Trae los gastos reales desde Supabase (tabla "gastos": monto INT, cobrador
// VARCHAR) y arma la cola de notificaciones de la sesión.

const DEMO_SIZE = 5;

// El orden del demo no es aleatorio: alterna gastos de negocio y personales
// para que la clasificación se vea real en los 3 minutos de pitch.
const DEMO_ORDER = ["COCA-COLA", "CARLSJR", "MARINELA", "RAPPI", "PAPELERIAROD"];

function formatMoney(amount) {
  return "$" + Math.round(amount).toLocaleString("es-MX");
}

async function cargarColaDeGastos() {
  try {
    const { data: registros, error } = await supabaseClient
      .from("gastos")
      .select("monto, cobrador");

    if (error) throw error;
    if (!registros || !registros.length) return [];

    const pendientes = registros.slice();
    const cola = [];

    DEMO_ORDER.forEach(function (nombre) {
      const i = pendientes.findIndex(function (r) { return r.cobrador === nombre; });
      if (i !== -1) cola.push(pendientes.splice(i, 1)[0]);
    });

    while (cola.length < DEMO_SIZE && pendientes.length) {
      cola.push(pendientes.splice(Math.floor(Math.random() * pendientes.length), 1)[0]);
    }

    return cola.slice(0, DEMO_SIZE).map(function (r) {
      return { merchant: r.cobrador, amount: r.monto };
    });
  } catch (error) {
    console.error("Error al obtener los datos de Supabase:", error.message);
    return [];
  }
}
