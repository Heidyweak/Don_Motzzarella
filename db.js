// Importa Mongoose
const mongoose = require('mongoose');

// ==========================================================
// 1. MODELO DE USUARIO (Para Registro y Login)
// ==========================================================

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true, // Asegura que no haya dos usuarios con el mismo nombre
        trim: true
    },
    password: { // Aquí se almacena el hash (encriptación)
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model('User', userSchema);

// ==========================================================
// 2. MODELO DE CARRITO (Para Productos)
// ==========================================================

const cartItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 1, min: 1 },
});

const cartSchema = new mongoose.Schema({
    // Asocia el carrito con un usuario. Usamos el 'username' del login como referencia temporal (userId)
    userId: {
        type: String,
        required: true,
        unique: true // Cada usuario solo tiene un carrito activo
    },
    items: [cartItemSchema], // Un array de los productos que contiene el carrito
    totalPrice: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true 
});

const Cart = mongoose.model('Cart', cartSchema);

// ==========================================================
// 3. Conexión a MongoDB
// ==========================================================

const connectDB = async () => {
    try {
        // Asegúrate de que esta URL coincida con tu docker-compose.yml
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Conectado a la base de datos Docker (Don_Motzzarella)');
    } catch (error) {
        console.error('❌ Error al conectar a la base de datos:', error.message);
        process.exit(1);
    }
};

module.exports = {
    connectDB,
    User, // Exporta el modelo de Usuario
    Cart  // Exporta el modelo de Carrito
};
