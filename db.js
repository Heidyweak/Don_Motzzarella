const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  port: 3307,       // cambia por el puerto que verificaste
  user: 'diego',    // usuario creado
  password: 'contraseña',
  database: 'Don_Motzzarella'
});

connection.connect((err) => {
  if (err) {
    console.error('Error de conexión: ' + err.stack);
    return;
  }
  console.log('Conectado a la base de datos!');
});ds

module.exports = connection;
