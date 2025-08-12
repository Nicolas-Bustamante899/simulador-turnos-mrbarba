const servicios = [
  { id: 1, nombre: "Corte de pelo", precio: 7500 },
  { id: 2, nombre: "Barba", precio: 6000 },
  { id: 3, nombre: "Corte + Barba", precio: 11500 },
];

function mostrarServicios() {
  console.log("Servicios disponibles:");
  servicios.forEach(servicio => {
    console.log(`${servicio.id}. ${servicio.nombre} - $${servicio.precio}`);
  });
}

function elegirServicio() {
  mostrarServicios();
  let eleccion = parseInt(prompt("Ingrese el número del servicio que desea (1, 2 o 3):"));

  let servicio = servicios.find(s => s.id === eleccion);

  if (servicio) {
    alert(`Elegiste: ${servicio.nombre} - $${servicio.precio}`);
    return servicio;
  } else {
    alert("Opción no válida. Intenta de nuevo.");
    return elegirServicio();
  }
}

function agendarTurno(servicio) {
  let dia = prompt("¿Qué día querés venir? (Ej: Lunes)");
  let hora = prompt("¿A qué hora? (Ej: 15:00)");

  let confirmar = confirm(`Confirmás este turno?\n\nServicio: ${servicio.nombre}\nDía: ${dia}\nHora: ${hora}\nPrecio: $${servicio.precio}`);

  if (confirmar) {
    alert("¡Turno reservado con éxito! Te esperamos en Mr. Barba 😎");
    console.log(`Turno reservado:\nServicio: ${servicio.nombre}\nDía: ${dia}\nHora: ${hora}`);
  } else {
    alert("Turno cancelado.");
  }
}

function iniciarSimulador() {
  alert("Bienvenido a Mr. Barba 💈 - Simulador de turnos");
  let servicioElegido = elegirServicio();
  agendarTurno(servicioElegido);
}

iniciarSimulador();


