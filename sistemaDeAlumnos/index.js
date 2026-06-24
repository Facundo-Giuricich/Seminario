const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: '192.168.100.10',
  user: 'usuario_consulta',
  password: '123',
  database: 'instituto'
});

db.connect((err) => {
  if (err) {
    console.error('Error conectando a la BD:', err);
    return;
  }
  console.log('Conectado a la base de datos en VM1');
});

// POST /grabaAlumnos
app.post('/grabaAlumnos', (req, res) => {
  const { apellidos, nombres, dni } = req.body;
  if (!apellidos || !nombres || !dni) {
    return res.json({ resultado: 0, mensaje: 'Faltan datos' });
  }
  const sql = 'INSERT INTO alumnos (apellidos, nombres, dni) VALUES (?, ?, ?)';
  db.query(sql, [apellidos, nombres, dni], (err) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.json({ resultado: 0, mensaje: 'DNI ya registrado' });
      }
      return res.json({ resultado: 0, mensaje: 'Error al guardar' });
    }
    res.json({ resultado: 1, mensaje: 'Alumno guardado correctamente' });
  });
});

// GET /consultarAlumnos
app.get('/consultarAlumnos', (req, res) => {
  const sql = 'SELECT apellidos, nombres, dni FROM alumnos ORDER BY apellidos, nombres';
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error al consultar' });
    }
    res.json(results);
  });
});

app.listen(3454, () => {
  console.log('Backend corriendo en puerto 3454');
});