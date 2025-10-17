// Importaciones de módulos
const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs'); // Importamos bcrypt para encriptación
const { connectDB, User, Cart } = require('./db'); 
require('dotenv').config(); 

// Inicialización de la aplicación
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json()); // Para manejar peticiones con body en formato JSON
app.use(express.urlencoded({ extended: true })); // Para manejar datos de formularios
app.use(express.static(path.join(__dirname, 'public'))); // Servir archivos estáticos (HTML, CSS, JS)

// Conexión a la base de datos
connectDB();

// ==========================================================
// FUNCIÓN AUXILIAR: Cálculo de Precio Total del Carrito
// ==========================================================
const calculateTotal = (items) => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
};


// ==========================================================
// RUTAS DE AUTENTICACIÓN: REGISTRO Y LOGIN
// ==========================================================

// RUTA POST: /api/register
// Propósito: Registrar un nuevo usuario y encriptar la contraseña.
app.post('/api/register', async (req, res) => {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
        return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios.' });
    }

    try {
        // Encriptar la contraseña (hash) antes de guardar
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ 
            username, 
            password: hashedPassword, // Guardamos la contraseña encriptada
            email 
        });
        await newUser.save();

        // Éxito en el registro
        res.status(201).json({ success: true, message: 'Usuario registrado con éxito.', userId: newUser._id });

    } catch (error) {
        // Manejar errores de clave duplicada (usuario o email ya existente)
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'El usuario o email ya existe.' });
        }
        console.error('Error durante el registro:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});


// RUTA POST: /api/login
// Propósito: Iniciar sesión, verificar contraseña y devolver el ID del usuario.
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'El usuario y la contraseña son obligatorios.' });
    }

    try {
        // 1. Buscar usuario por nombre de usuario
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
        }

        // 2. Comparar la contraseña ingresada con la encriptada en la base de datos
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
        }

        // ¡Login exitoso!
        res.status(200).json({ success: true, message: 'Inicio de sesión exitoso.', userId: user.username }); // Usamos el username como ID de sesión temporal
                                                                                                           // (En una app real sería un token)

    } catch (error) {
        console.error('Error durante el login:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});


// ==========================================================
// RUTAS DE CARRITO DE COMPRAS
// ==========================================================

// RUTA POST: /api/cart/add
// Propósito: Agregar o actualizar un artículo en el carrito del usuario.
app.post('/api/cart/add', async (req, res) => {
    const { userId, name, price, quantity = 1 } = req.body;

    if (!userId || !name || !price) {
        return res.status(400).json({ success: false, message: 'Faltan campos obligatorios para el carrito (userId, name, price).' });
    }
    
    // Conversión a números
    const itemPrice = Number(price);
    const itemQuantity = Number(quantity);

    try {
        // Busca el carrito por el userId (usando username como ID temporal de sesión)
        let cart = await Cart.findOne({ userId });

        if (!cart) {
            // Si el usuario no tiene carrito, creamos uno nuevo
            cart = new Cart({ userId, items: [] });
        }

        // 1. Verificar si el artículo ya existe en el carrito
        const existingItemIndex = cart.items.findIndex(item => item.name === name);

        if (existingItemIndex > -1) {
            // 2. Si existe, actualiza la cantidad
            cart.items[existingItemIndex].quantity += itemQuantity;
        } else {
            // 3. Si no existe, añade el nuevo artículo
            cart.items.push({ name, price: itemPrice, quantity: itemQuantity });
        }

        // Recalcular el precio total
        cart.totalPrice = calculateTotal(cart.items);
        
        await cart.save();
        res.status(200).json({ success: true, message: 'Artículo agregado o actualizado en el carrito.', cart });

    } catch (error) {
        console.error('Error al agregar al carrito:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor al gestionar el carrito.' });
    }
});


// RUTA GET: /api/cart/:userId
// Propósito: Obtener el contenido del carrito de un usuario específico.
app.get('/api/cart/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({ success: false, message: 'Carrito no encontrado para este usuario.' });
        }

        res.status(200).json({ success: true, cart });

    } catch (error) {
        console.error('Error al obtener el carrito:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});


// RUTA GET para servir el index.html (página principal)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Inicialización del servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor activo en http://localhost:${PORT}`);
});
