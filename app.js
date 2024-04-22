const express = require('express');
const cors = require('cors');
const formRoutes = require('./routes/formRoutes');
const { connectToDatabase } = require('./config/db');
const { setupEmail } = require('./config/email');

const app = express();
const port = process.env.PORT || 3001;

require('dotenv').config();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Conexión a bases de datos
connectToDatabase();

// Configuración de correo electrónico
setupEmail();

// Rutas
app.use('/', formRoutes);

app.listen(port, () => {
    console.log(`Servidor ejecutándose en http://localhost:${port}`);
});
