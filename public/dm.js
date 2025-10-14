
  const modal = document.getElementById("loginModal");
  const closeBtn = document.querySelector(".close");
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const deliveryForm = document.getElementById("deliveryForm");
  const userDisplay = document.getElementById("userDisplay");

  // Mostrar modal con animación
  window.onload = function() {
    modal.style.display = "block";
    setTimeout(() => modal.classList.add("show"), 10);
  };

  // Cerrar modal
  function closeModal() {
    modal.classList.remove("show");
    setTimeout(() => modal.style.display = "none", 500);
  }

  closeBtn.onclick = closeModal;
  window.onclick = function(event) {
    if (event.target == modal) closeModal();
  }

  // Cambiar entre formularios
  document.getElementById("registerBtn").onclick = function() {
    loginForm.style.display = "none";
    registerForm.style.display = "block";
  }
  document.getElementById("backToLogin1").onclick = function() {
    registerForm.style.display = "none";
    loginForm.style.display = "block";
  }
  document.getElementById("deliveryBtn").onclick = function() {
    loginForm.style.display = "none";
    deliveryForm.style.display = "block";
  }
  document.getElementById("backToLogin2").onclick = function() {
    deliveryForm.style.display = "none";
    loginForm.style.display = "block";
  }

  // Login normal
  document.getElementById("loginFormElement").addEventListener("submit", function(e) {
    e.preventDefault();
    const username = document.getElementById("username").value;
    userDisplay.textContent = `${username} 🔥`;
    closeModal();
  });

  // Login repartidor
  document.getElementById("deliveryFormElement").addEventListener("submit", function(e) {
    e.preventDefault();
    const username = document.getElementById("deliveryUser").value;
    userDisplay.textContent = `${username} 🚴‍♂️`;
    closeModal();
  });

  // Registro
  document.getElementById("registerFormElement").addEventListener("submit", function(e) {
    e.preventDefault();
    const username = document.getElementById("newUsername").value;
    userDisplay.textContent = `${username} 🎉`;
    closeModal();
  });
  