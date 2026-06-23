// variables globales para guardar tamaño de matrices
let filas, columnas;

// esta función crea dinámicamente los inputs de las matrices
function crearMatrices() {
  filas = document.getElementById("filas").value;
  columnas = document.getElementById("columnas").value;

  let html = "";

  // genero dos matrices
  for (let m = 1; m <= 2; m++) {
    html += `<h3>Matriz ${m}</h3>`;

    for (let i = 0; i < filas; i++) {
      for (let j = 0; j < columnas; j++) {
        // cada input representa una celda
        html += `<input type="number" id="m${m}-${i}-${j}" style="width:50px">`;
      }
      html += "<br>";
    }
  }

  // inserto todo en el HTML
  document.getElementById("matrices").innerHTML = html;
}

// esta función arma una matriz leyendo los valores del HTML
function obtenerMatriz(num) {
  let matriz = [];

  for (let i = 0; i < filas; i++) {
    let fila = [];

    for (let j = 0; j < columnas; j++) {
      let val = document.getElementById(`m${num}-${i}-${j}`).value;

      // valido que no esté vacío
      if (val === "") {
        alert("Complete todos los valores");
        return null;
      }

      fila.push(Number(val)); // convierto a número
    }

    matriz.push(fila);
  }

  return matriz;
}

// suma en el cliente (sin backend)
function sumar() {
  let m1 = obtenerMatriz(1);
  let m2 = obtenerMatriz(2);

  if (!m1 || !m2) return;

  let res = [];

  // suma posición por posición
  for (let i = 0; i < filas; i++) {
    let fila = [];

    for (let j = 0; j < columnas; j++) {
      fila.push(m1[i][j] + m2[i][j]);
    }

    res.push(fila);
  }

  mostrar(res);
}

// multiplicación de matrices (cliente)
function multiplicar() {
  let m1 = obtenerMatriz(1);
  let m2 = obtenerMatriz(2);

  if (!m1 || !m2) return;

  let res = [];

  // lógica clásica de multiplicación
  for (let i = 0; i < filas; i++) {
    res[i] = [];
    for (let j = 0; j < columnas; j++) {
      res[i][j] = 0;

      for (let k = 0; k < columnas; k++) {
        res[i][j] += m1[i][k] * m2[k][j];
      }
    }
  }

  mostrar(res);
}

// muestra la matriz resultado en pantalla
function mostrar(matriz) {
  let html = "";

  matriz.forEach(fila => {
    html += fila.join(" ") + "<br>";
  });

  document.getElementById("resultado").innerHTML = html;
}