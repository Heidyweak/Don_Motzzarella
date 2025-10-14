const express = require("express");
const path = require("path");
const db = require("./db");

const app = express();
const PORT = 7000;

// Middleware para JSON
app.use(express.json());

// Servir archivos estáticos (frontend)
app.use(express.static(path.join(__dirname, "public")));

// Ruta principal -> tu página
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Ruta genérica: permite consultar cualquier tabla
app.get("/api/:tabla", (req, res) => {
  const tabla = req.params.tabla;

  // ⚠️ IMPORTANTE: proteger contra SQL Injection en producción.
  const query = `SELECT * FROM ??`;
  db.query(query, [tabla], (err, results) => {
    if (err) {
      console.error("Error en la consulta:", err);
      return res.status(500).json({ error: "Error en la base de datos" });
    }
    res.json(results);
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
