let alumnos = [];

// Generar ID único por usuario (se guarda en el navegador)
let userId = localStorage.getItem("userId");

if (!userId) {
  userId = crypto.randomUUID();
  localStorage.setItem("userId", userId);
}

// Traer datos del backend
async function cargarAlumnos() {
  const res = await fetch(`/alumnos/${userId}`);
  alumnos = await res.json();
  mostrarAlumnos();
}

function mostrarAlumnos() {
  const lista = document.getElementById("lista");
  lista.innerHTML = "";

  let ordenados = [...alumnos].sort((a, b) => {
    if (b.nota !== a.nota) return b.nota - a.nota;
    return a.nombre.localeCompare(b.nombre);
  });

  ordenados.forEach(a => {
    let li = document.createElement("li");
    li.textContent = `${a.nombre} - Edad: ${a.edad} - Nota: ${a.nota}`;
    lista.appendChild(li);
  });
}

// Guardar en backend
async function guardarAlumnos() {
  await fetch(`/alumnos/${userId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(alumnos)
  });
}

function agregarAlumno() {
  const nombre = document.getElementById("nombre").value;
  const edad = document.getElementById("edad").value;
  const nota = document.getElementById("nota").value;

  if (!nombre || !edad || !nota) {
    alert("Completá todo");
    return;
  }

  alumnos.push({
    nombre,
    edad: parseInt(edad),
    nota: parseFloat(nota)
  });

  guardarAlumnos();
  mostrarAlumnos();

  document.getElementById("nombre").value = "";
  document.getElementById("edad").value = "";
  document.getElementById("nota").value = "";
}

// cargar al iniciar
cargarAlumnos();