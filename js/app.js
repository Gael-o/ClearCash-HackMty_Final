// app.js
// Punto de arranque. No contiene lógica de negocio: solo conecta el botón
// "Notificación" con el flujo de NotificationFlow.

document.getElementById("notifBtn").addEventListener("click", NotificationFlow.start);