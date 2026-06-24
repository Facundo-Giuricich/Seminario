import express from "express"
const PORT = 3000;
const app = express()

app.use(express.json());
app.use(express.static("public"));

// "Base de datos" en memoria
let baseDatos = {};

// Obtener alumnos de un usuario
app.get("/alumnos/:userId", (req, res) => {
  const userId = req.params.userId;
  res.json(baseDatos[userId] || []);
});

// Guardar alumnos de un usuario
app.post("/alumnos/:userId", (req, res) => {
  const userId = req.params.userId;
  baseDatos[userId] = req.body;
  res.json({ mensaje: "Datos guardados" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});