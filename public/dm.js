// Configuraciones Globales de Firebase (MANDATORIO)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

// Variables de Firebase
let app, db, auth;
let userId = 'anonimo'; // Valor predeterminado

// --- Variables del DOM ---
const modal = document.getElementById("loginModal");
const closeBtn = document.querySelector(".close");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const deliveryForm = document.getElementById("deliveryForm");
const userDisplay = document.getElementById("userDisplay");
const reviewForm = document.getElementById("reviewForm"); // Para la sección de reseñas
const reviewsContainer = document.getElementById("reviewsContainer"); // Para la sección de reseñas
const formMsg = document.getElementById("formMsg"); // Para mensajes de reseña
const clearBtn = document.getElementById("clearBtn"); // Botón de limpiar reseña

// --- Variables para los formularios de autenticación ---
const loginFormElement = document.getElementById("loginFormElement");
const registerFormElement = document.getElementById("registerFormElement");
const deliveryFormElement = document.getElementById("deliveryFormElement");
const registerBtn = document.getElementById("registerBtn");
const deliveryBtn = document.getElementById("deliveryBtn");
const backToLogin1 = document.getElementById("backToLogin1");
const backToLogin2 = document.getElementById("backToLogin2");
const authMsg = document.getElementById("authMsg"); // Asume que tienes un span/p con este ID dentro del modal para mensajes

// #region FIREBASE INITIALIZATION AND AUTH STATE

/**
 * Función para inicializar Firebase y establecer el estado de autenticación.
 */
async function initializeFirebase() {
  try {
    // Importación de módulos de firebase
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js");
    const { getAuth, signInWithCustomToken, signInAnonymously, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js");
    const { getFirestore, setDoc, doc, collection, query, where, onSnapshot } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js");
    
    // 1. Inicializar app, db y auth
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    // 2. Autenticación inicial (si no hay token, usa anónimo)
    if (typeof __initial_auth_token !== 'undefined') {
        await signInWithCustomToken(auth, __initial_auth_token);
    } else {
        await signInAnonymously(auth);
    }
    
    // 3. Listener de cambios en el estado de autenticación
    onAuthStateChanged(auth, (user) => {
        if (user) {
            userId = user.uid;
            // Si el usuario no es anónimo, mostramos el email o un nombre
            if (!user.isAnonymous && user.email) {
                userDisplay.innerHTML = `¡Hola, ${user.email.split('@')[0]}! <button onclick="handleLogout()" class="nav-logout-btn">(Salir)</button>`;
            } else {
                // Si es anónimo, sigue mostrando el botón de login
                userDisplay.innerHTML = `<button onclick="openLoginModal()" class="nav-login-btn">Iniciar Sesión</button>`;
            }
        } else {
            userId = 'anonimo';
            userDisplay.innerHTML = `<button onclick="openLoginModal()" class="nav-login-btn">Iniciar Sesión</button>`;
        }
        // Cada vez que cambia el estado, intentamos cargar las reseñas
        loadReviews(); 
    });

    // 4. Configura listeners de formularios DESPUÉS de que db y auth estén listos
    setupEventListeners(); 

  } catch (error) {
    console.error("Error al inicializar Firebase o autenticar:", error);
  }
}

// #endregion

// #region UTILERIAS Y MANEJO DEL MODAL

/**
 * Función para obtener la ruta de la colección de reseñas públicas
 */
function getReviewsCollectionRef() {
    return `artifacts/${appId}/public/data/reviews`;
}

/**
 * Función para abrir el modal de inicio de sesión
 */
function openLoginModal() {
    modal.style.display = "flex";
    // Asegurarse de mostrar el formulario de login primero
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    deliveryForm.style.display = 'none';
    if (authMsg) authMsg.textContent = '';
}

/**
 * Función para cerrar el modal
 */
function closeLoginModal() {
    modal.style.display = "none";
}

/**
 * Maneja el cierre de sesión.
 */
async function handleLogout() {
    try {
        await auth.signOut();
        // Redirigir a anónimo para seguir usando Firestore (si es necesario)
        await auth.signInAnonymously();
        console.log("Sesión cerrada y autenticado como anónimo.");
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
    }
}

// #endregion

// #region LISTENERS PARA AUTENTICACIÓN Y VISTAS DEL MODAL

function setupAuthListeners() {
    if (modal) modal.addEventListener('click', (e) => {
        if (e.target === modal) closeLoginModal();
    });
    if (closeBtn) closeBtn.addEventListener('click', closeLoginModal);
    if (registerBtn) registerBtn.addEventListener('click', () => {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        deliveryForm.style.display = 'none';
        if (authMsg) authMsg.textContent = '';
    });
    if (deliveryBtn) deliveryBtn.addEventListener('click', () => {
        loginForm.style.display = 'none';
        registerForm.style.display = 'none';
        deliveryForm.style.display = 'block';
        if (authMsg) authMsg.textContent = '';
    });
    if (backToLogin1) backToLogin1.addEventListener('click', () => {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        deliveryForm.style.display = 'none';
        if (authMsg) authMsg.textContent = '';
    });
    if (backToLogin2) backToLogin2.addEventListener('click', () => {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        deliveryForm.style.display = 'none';
        if (authMsg) authMsg.textContent = '';
    });

    // Event Listener para Login
    loginFormElement?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('username').value.trim(); // Asume que el campo es email
        const password = document.getElementById('password').value.trim();

        if (authMsg) authMsg.textContent = 'Iniciando sesión...';
        try {
            await signInWithEmailAndPassword(auth, email, password);
            if (authMsg) authMsg.textContent = '¡Inicio de sesión exitoso!';
            closeLoginModal();
        } catch (error) {
            console.error("Error en login:", error);
            if (authMsg) authMsg.textContent = 'Error: Credenciales inválidas o cuenta no existe.';
        }
    });

    // Event Listener para Registro
    registerFormElement?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('newPassword').value.trim();
        
        if (authMsg) authMsg.textContent = 'Creando cuenta...';
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            if (authMsg) authMsg.textContent = '¡Registro exitoso! Iniciando sesión...';
            closeLoginModal();
        } catch (error) {
            console.error("Error en registro:", error);
            if (authMsg) authMsg.textContent = `Error al registrar: ${error.message}`;
        }
    });

    // Event Listener para Repartidor (simulado, solo login)
    deliveryFormElement?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('deliveryUser').value.trim(); // Asume que el campo es email
        const password = document.getElementById('deliveryPassword').value.trim();
        // El campo 'vehicle' es solo para la interfaz, no se usa en la autenticación de Firebase
        
        if (authMsg) authMsg.textContent = 'Iniciando sesión como repartidor...';
        try {
            await signInWithEmailAndPassword(auth, email, password);
            if (authMsg) authMsg.textContent = '¡Inicio de sesión de repartidor exitoso!';
            closeLoginModal();
        } catch (error) {
            console.error("Error en login repartidor:", error);
            if (authMsg) authMsg.textContent = 'Error: Credenciales de repartidor inválidas.';
        }
    });
}
// #endregion

// #region LISTENERS PARA RESEÑAS Y UTILERIAS
/**
 * Inicializa los Event Listeners para el formulario de reseña 
 * después de que Firebase y las variables del DOM han sido definidas.
 */
function setupEventListeners() {
    // 1. Event Listeners de Autenticación
    setupAuthListeners();

    // 2. Enviar Reseña a Firestore
    if (reviewForm) {
        reviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Requerir autenticación
            if (!auth.currentUser || auth.currentUser.isAnonymous) {
                formMsg.textContent = "Por favor, inicia sesión para dejar una reseña.";
                formMsg.style.color = 'red';
                return;
            }

            const name = document.getElementById('name').value.trim() || (auth.currentUser.email ? auth.currentUser.email.split('@')[0] : 'Usuario Registrado');
            const comment = document.getElementById('comment').value.trim();
            // Los input[name="rating"] están en el HTML
            const ratingElement = document.querySelector('input[name="rating"]:checked'); 
            const rating = ratingElement ? parseInt(ratingElement.value) : 0;
            
            if (comment.length < 5 || rating === 0) {
                formMsg.textContent = "Por favor, escribe un comentario y selecciona una valoración.";
                formMsg.style.color = 'red';
                return;
            }

            try {
                const { addDoc, collection, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js");
                
                await addDoc(collection(db, getReviewsCollectionRef()), {
                    authorName: name,
                    comment: comment,
                    rating: rating,
                    timestamp: serverTimestamp(),
                    userId: auth.currentUser.uid,
                    userEmail: auth.currentUser.email || 'N/A'
                });

                formMsg.textContent = "¡Reseña enviada con éxito! Gracias por tu opinión.";
                formMsg.style.color = 'green';
                reviewForm.reset();
                // Desmarcar la estrella
                document.querySelectorAll('.stars input[type="radio"]').forEach(radio => radio.checked = false); 
                setTimeout(() => formMsg.textContent = '', 3000);
                
            } catch (error) {
                console.error("Error al enviar la reseña:", error);
                formMsg.textContent = `Error al enviar la reseña: ${error.message}`;
                formMsg.style.color = 'red';
            }
        });
    }

    // 3. Lógica de limpiar formulario de reseña
    clearBtn?.addEventListener('click', () => {
        reviewForm.reset();
        document.querySelectorAll('.stars input[type="radio"]').forEach(radio => radio.checked = false); 
        formMsg.textContent = '';
    });
}
// #endregion

// #region LÓGICA DE CARGA Y ELIMINACIÓN DE RESEÑAS

// 2. Renderizar una sola reseña
function renderReview(review) {
    const reviewDiv = document.createElement('div');
    reviewDiv.classList.add('review-item');
    
    // Generar estrellas
    const starsHtml = Array(5).fill().map((_, i) => 
        i < review.rating ? '⭐' : '☆'
    ).join('');

    // Formatear la fecha
    let dateStr = 'Fecha desconocida';
    if (review.timestamp && review.timestamp.toDate) {
        const date = review.timestamp.toDate();
        dateStr = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    } else if (review.timestamp && review.timestamp._seconds) { 
         // Caso para objetos de timestamp parciales
         const date = new Date(review.timestamp._seconds * 1000);
         dateStr = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    } else if (review.timestamp) {
        dateStr = new Date(review.timestamp).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    reviewDiv.innerHTML = `
        <div class="review-header">
            <span class="review-name">${review.authorName}</span>
            <span class="review-stars">${starsHtml}</span>
        </div>
        <p class="review-comment">${review.comment}</p>
        <span class="review-date">${dateStr}</span>
    `;

    // Si el usuario es el autor, añadimos un botón de eliminar
    if (auth.currentUser && auth.currentUser.uid === review.userId) {
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Eliminar';
        deleteBtn.classList.add('delete-btn');
        // Usamos una función que llama a la lógica de eliminación directa
        deleteBtn.addEventListener('click', () => deleteReview(review.id)); 
        reviewDiv.appendChild(deleteBtn);
    }
    
    return reviewDiv;
}

// 3. Eliminar Reseña (solo si el usuario es el autor)
async function deleteReview(reviewId) {
    // Implementación de confirmación no nativa para cumplir con la regla
    const isConfirmed = true; // Aquí se saltaría un modal de UI en un entorno real.

    if (!isConfirmed) return;

    try {
        const { deleteDoc, doc } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js");
        const reviewDocRef = doc(db, getReviewsCollectionRef(), reviewId);
        await deleteDoc(reviewDocRef);
        console.log("Reseña eliminada con éxito.");
    } catch (error) {
        console.error("Error al eliminar la reseña:", error);
    }
}

// 4. Cargar Reseñas en Tiempo Real (onSnapshot)
async function loadReviews() {
    if (!db || !reviewsContainer) {
        console.warn("Firestore o reviewsContainer no están inicializados.");
        return;
    }
    
    const { onSnapshot, collection, query } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js");
    
    const reviewsQuery = query(collection(db, getReviewsCollectionRef())); 
    
    // Suscribirse a los cambios en tiempo real
    onSnapshot(reviewsQuery, (snapshot) => {
        reviewsContainer.innerHTML = ''; // Limpiar el contenedor
        
        // Convertir y ordenar los documentos (ordenamiento en el cliente para evitar problemas de índice)
        const reviews = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            reviews.push({ id: doc.id, ...data });
        });
        
        // Ordenar en el cliente por timestamp (descendente)
        reviews.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));

        // Renderizar las reseñas (mostramos las primeras 20)
        reviews.slice(0, 20).forEach(review => {
            reviewsContainer.appendChild(renderReview(review));
        });

        if (reviews.length === 0) {
            reviewsContainer.innerHTML = '<p class="no-reviews">Aún no hay reseñas. ¡Sé el primero en opinar!</p>';
        }
        
    }, (error) => {
        console.error("Error al cargar las reseñas en tiempo real:", error);
        reviewsContainer.innerHTML = '<p class="error-msg">Error al cargar las reseñas.</p>';
    });
}

// #endregion

// Llamada inicial para iniciar todo
window.onload = initializeFirebase;
