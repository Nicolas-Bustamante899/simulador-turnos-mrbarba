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

// ----- UTILIDADES -----
const currency = n => new Intl.NumberFormat('es-AR', { style:'currency', currency:'ARS', maximumFractionDigits:0 }).format(n);

function setMsg(texto, tipo='') {
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
    console.warn('Usando servicios por defecto (no se pudo leer JSON):', e.message);
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
      setMsg('Servicio cargado en el formulario ✔️', 'ok');
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
      return;
    }
    try {
      agregarTurno(data);
      $form.reset();
      setMsg('Turno agregado correctamente ✅', 'ok');
    } catch (error) {
      setMsg(error.message, 'error');
    }
  });

  // Eliminar turno (delegación)
  $tbody.addEventListener('click', (e) => {
    const id = e.target?.dataset?.del;
    if (id) {
      eliminarTurno(id);
      setMsg('Turno eliminado 🗑️', 'ok');
    }
  });

  // Limpiar todos
  $btnLimpiar.addEventListener('click', () => {
    TURNOS = [];
    guardarTurnos();
    renderTurnos();
    setMsg('Se vaciaron los turnos.', 'ok');
  });
});
