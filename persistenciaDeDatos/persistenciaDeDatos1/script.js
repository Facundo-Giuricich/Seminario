// Cargar datos guardados o iniciar vacío
let alumnos = JSON.parse(localStorage.getItem("alumnos")) || [];

function guardarDatos() {
  localStorage.setItem("alumnos", JSON.stringify(alumnos));
}

function mostrarAlumnos() {
  const lista = document.getElementById("lista");
  lista.innerHTML = "";

  // Ordenar por nota DESC y nombre ASC
  let ordenados = [...alumnos].sort((a, b) => {
    if (b.nota !== a.nota) {
      return b.nota - a.nota;
    }
    return a.nombre.localeCompare(b.nombre);
  });

  ordenados.forEach(alumno => {
    let li = document.createElement("li");
    li.textContent = `${alumno.nombre} - Edad: ${alumno.edad} - Nota: ${alumno.nota}`;
    lista.appendChild(li);
  });
}

function agregarAlumno() {
  const nombre = document.getElementById("nombre").value;
  const edad = document.getElementById("edad").value;
  const nota = document.getElementById("nota").value;

  if (nombre === "" || edad === "" || nota === "") {
    alert("Completá todos los campos");
    return;
  }

  alumnos.push({
    nombre: nombre,
    edad: parseInt(edad),
    nota: parseFloat(nota)
  });

  guardarDatos();
  mostrarAlumnos();

  // limpiar inputs
  document.getElementById("nombre").value = "";
  document.getElementById("edad").value = "";
  document.getElementById("nota").value = "";
}

// Mostrar al cargar la página
mostrarAlumnos();