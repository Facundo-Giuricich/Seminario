const express = require("express");
const cors = require("cors");

const app = express();

// permite recibir JSON del frontend
app.use(express.json());

// permite conectar frontend con backend
app.use(cors());

// endpoint para sumar matrices
app.post("/sumar", (req, res) => {
  const { m1, m2 } = req.body;

  // recorro ambas matrices y sumo
  let resultado = m1.map((fila, i) =>
    fila.map((val, j) => val + m2[i][j])
  );

  res.json(resultado);
});

// endpoint para multiplicar matrices
app.post("/multiplicar", (req, res) => {
  const { m1, m2 } = req.body;

  let resu = [];

  // lógica de multiplicación
  for (let i = 0; i < m1.length; i++) {
    resu[i] = [];
    for (let j = 0; j < m2[0].length; j++) {
      resu[i][j] = 0;

      for (let k = 0; k < m2.length; k++) {
        resu[i][j] += m1[i][k] * m2[k][j];
      }
    }
  }

  res.json(resu);
});

// levanto el servidor
app.listen(3000, () => console.log("Servidor en puerto 3000"));