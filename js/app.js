// ----- MODELO -----
// Función constructora para servicios
function Servicio(id, nombre, precio) {
  this.id = id;
  this.nombre = nombre;
  this.precio = precio;
}

// Estado de la app
let SERVICIOS = [];           // se carga desde JSON o fallback
let TURNOS = [];              // se persiste en localStorage

// ----- SELECTORES -----
const $listaServicios = document.getElementById('listaServicios');
const $selectServicio = document.getElementById('servicio');
const $form = document.getElementById('formTurno');
const $msg = document.getElementById('msg');
const $tbody = document.getElementById('tbodyTurnos');
const $total = document.getElementById('total');
const $btnLimpiar = document.getElementById('btnLimpiar');
const $btnConfirmar = document.getElementById('btnConfirmar');

// ----- UTILIDADES -----
const currency = n => new Intl.NumberFormat('es-AR', { style:'currency', currency:'ARS', maximumFractionDigits:0 }).format(n);

function setMsg(texto, tipo='') {
  // keep small in-page messages for validation only
  $msg.className = 'msg ' + (tipo ? tipo : '');
  $msg.textContent = texto || '';
}

function guardarTurnos() {
  localStorage.setItem('turnos', JSON.stringify(TURNOS));
}

function cargarTurnos() {
  const data = localStorage.getItem('turnos');
  TURNOS = data ? JSON.parse(data) : [];
}

function totalTurnos() {
  return TURNOS.reduce((acc, t) => acc + t.precio, 0);
}

// ----- RENDER -----
function renderServicios() {
  $listaServicios.innerHTML = '';
  $selectServicio.innerHTML = '<option value="">Elegí un servicio...</option>';
  SERVICIOS.forEach(s => {
    // cards
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <h3>${s.nombre}</h3>
      <p class="badge">${currency(s.precio)}</p>
      <button class="btn small" data-add="${s.id}">Agregar al formulario</button>
    `;
    $listaServicios.appendChild(card);

    // select
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = `${s.nombre} — ${currency(s.precio)}`;
    $selectServicio.appendChild(opt);
  });
}

function renderTurnos() {
  $tbody.innerHTML = '';
  TURNOS.forEach((t, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${t.cliente}</td>
      <td>${t.servicio}</td>
      <td>${t.fecha}</td>
      <td>${t.hora}</td>
      <td>${currency(t.precio)}</td>
      <td><button class="btn small outline" data-del="${t.id}">Eliminar</button></td>
    `;
    $tbody.appendChild(tr);
  });
  $total.textContent = currency(totalTurnos());
}

// ----- ACCIONES -----
function agregarTurno({ cliente, servicioId, fecha, hora }) {
  const servicio = SERVICIOS.find(s => s.id === Number(servicioId));
  if (!servicio) throw new Error('Servicio no encontrado');

  const turno = {
    id: crypto.randomUUID(),
    cliente,
    servicio: servicio.nombre,
    precio: servicio.precio,
    fecha,
    hora
  };
  TURNOS.push(turno);
  guardarTurnos();
  renderTurnos();
  return turno;
}

function eliminarTurno(id) {
  TURNOS = TURNOS.filter(t => t.id !== id);
  guardarTurnos();
  renderTurnos();
}

// ----- CARGA DE DATOS -----
async function cargarServicios() {
  // Intentar leer JSON local; si falla (por CORS en file://), usar fallback
  try {
    const res = await fetch('./data/servicios.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    SERVICIOS = data.map(s => new Servicio(s.id, s.nombre, s.precio));
  } catch (e) {
    // Fallback
    SERVICIOS = [
      new Servicio(1, 'Corte de pelo', 7500),
      new Servicio(2, 'Barba', 6000),
      new Servicio(3, 'Corte + Barba', 11500),
    ];
    // no console output; show an in-page message if needed
    setMsg('Cargando servicios desde fallback. (Si abrís por file:// el fetch puede fallar)', 'error');
  }
}

// ----- VALIDACIÓN -----
function validarForm({ cliente, servicioId, fecha, hora }) {
  if (!cliente || cliente.trim().length < 2) return 'Ingresá un nombre válido.';
  if (!servicioId) return 'Seleccioná un servicio.';
  if (!fecha) return 'Elegí una fecha.';
  if (!hora) return 'Elegí un horario.';
  // Evitar horarios fuera de rango (opcional)
  const [hh, mm] = hora.split(':').map(Number);
  if (hh < 9 || (hh > 20) || (hh === 20 && mm > 0)) return 'Horario fuera de atención (09:00 a 20:00).';
  // Evitar fechas pasadas
  const hoy = new Date();
  const fechaElegida = new Date(fecha + 'T' + hora);
  if (fechaElegida < hoy) return 'No podés reservar en el pasado.';
  return '';
}

// ----- EVENTOS -----
document.addEventListener('DOMContentLoaded', async () => {
  cargarTurnos();
  await cargarServicios();
  renderServicios();
  renderTurnos();

  // Click en cards -> selecciona servicio en el form
  $listaServicios.addEventListener('click', (e) => {
    const id = e.target?.dataset?.add;
    if (id) {
      $selectServicio.value = id;
      // show a small toast using SweetAlert2
      Swal.fire({
        toast: true,
        position: 'top-end',
        timer: 1500,
        showConfirmButton: false,
        icon: 'success',
        title: 'Servicio cargado en el formulario'
      });
    }
  });

  // Submit del formulario
  $form.addEventListener('submit', (e) => {
    e.preventDefault();
    setMsg('');
    const data = {
      cliente: document.getElementById('cliente').value,
      servicioId: document.getElementById('servicio').value,
      fecha: document.getElementById('fecha').value,
      hora: document.getElementById('hora').value,
    };
    const err = validarForm(data);
    if (err) {
      setMsg(err, 'error');
      // also show a modal
      Swal.fire({ icon: 'error', title: 'Error', text: err });
      return;
    }
    try {
      agregarTurno(data);
      $form.reset();
      setMsg('Turno agregado correctamente ✅', 'ok');
      Swal.fire({ icon: 'success', title: 'Turno agregado', text: 'Se guardó el turno correctamente.' });
    } catch (error) {
      setMsg(error.message, 'error');
      Swal.fire({ icon: 'error', title: 'Error', text: error.message });
    }
  });

  // Eliminar turno (delegación) with confirmation
  $tbody.addEventListener('click', (e) => {
    const id = e.target?.dataset?.del;
    if (id) {
      const turno = TURNOS.find(t => t.id === id);
      Swal.fire({
        title: 'Eliminar turno',
        html: `Eliminar turno de <strong>${turno.cliente}</strong><br>${turno.servicio} - ${turno.fecha} ${turno.hora}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      }).then(result => {
        if (result.isConfirmed) {
          eliminarTurno(id);
          Swal.fire({ icon: 'success', title: 'Eliminado', text: 'Turno eliminado correctamente.' });
        }
      });
    }
  });

  // Limpiar todos with confirmation
  $btnLimpiar.addEventListener('click', () => {
    if (TURNOS.length === 0) {
      Swal.fire({ icon: 'info', title: 'Sin turnos', text: 'No hay turnos para vaciar.' });
      return;
    }
    Swal.fire({
      title: 'Vaciar todos los turnos?',
      text: 'Se eliminarán todos los turnos guardados en el navegador.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, vaciar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        TURNOS = [];
        guardarTurnos();
        renderTurnos();
        Swal.fire({ icon: 'success', title: 'Turnos vaciados', text: 'Se eliminaron todos los turnos.' });
      }
    });
  });

  // Confirmar todos (simula proceso de checkout / pago)
  $btnConfirmar.addEventListener('click', () => {
    if (TURNOS.length === 0) {
      Swal.fire({ icon: 'info', title: 'Sin turnos', text: 'No hay turnos para confirmar.' });
      return;
    }
    // construir resumen
    const resumen = TURNOS.map((t, i) => `${i+1}. ${t.cliente} — ${t.servicio} — ${t.fecha} ${t.hora} — ${currency(t.precio)}`).join('<br>');
    Swal.fire({
      title: 'Confirmar turnos',
      html: `<div style="text-align:left">${resumen}<hr><strong>Total: ${currency(totalTurnos())}</strong></div>`,
      showCancelButton: true,
      confirmButtonText: 'Confirmar y procesar',
      cancelButtonText: 'Volver'
    }).then(result => {
      if (result.isConfirmed) {
        // Simulamos "procesamiento" y luego vaciamos
        Swal.fire({
          title: 'Procesando...',
          text: 'Simulando pago y envío de confirmaciones.',
          didOpen: () => {
            Swal.showLoading();
          },
          timer: 1500,
          showConfirmButton: false
        }).then(() => {
          TURNOS = [];
          guardarTurnos();
          renderTurnos();
          Swal.fire({ icon: 'success', title: 'Turnos confirmados', text: 'Se confirmaron y guardaron las reservas.' });
        });
      }
    });
  });

});