// data.js
// Datos compartidos: obtiene transacciones reales desde Supabase (tabla
// "gastos": monto INT, cobrador VARCHAR) y utilidades de formato usadas
// por el resto de la app. Script clásico: depende de que supabaseClient.js
// ya haya corrido antes (ver orden de <script> en index.html).

function formatMoney(amount) {
  return "$" + Math.round(amount).toLocaleString("es-MX");
}

async function obtenerDatosDesdeSupabase() {
  try {
    // 1. Llamamos a Supabase para traer todas las filas de la tabla
    const { data: registros, error } = await supabaseClient
      .from("gastos")
      .select("monto, cobrador"); // Especificamos las variables que queremos

    // Si Supabase nos devuelve un error, lo lanzamos al catch
    if (error) throw error;

    // 2. Verificamos que sí haya datos en la base de datos
    if (registros && registros.length > 0) {
      // Elegimos un registro al azar (manteniendo tu lógica original)
      const registroAlAzar = registros[Math.floor(Math.random() * registros.length)];

      // 3. Retornamos AMBAS variables en forma de objeto
      return {
        monto: registroAlAzar.monto,
        cobrador: registroAlAzar.cobrador
      };
    }

    return null; // Si la tabla está vacía
  } catch (error) {
    console.error("Error al obtener los datos de Supabase:", error.message);
    return null;
  }
}
