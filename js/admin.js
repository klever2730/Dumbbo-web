import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDEhG5JEj8s2GMQgdceHY3LeUa_32jx_MI",
  authDomain: "dumbbo-menu.firebaseapp.com",
  projectId: "dumbbo-menu",
  storageBucket: "dumbbo-menu.firebasestorage.app",
  messagingSenderId: "875230670130",
  appId: "1:875230670130:web:63ad4fb93cb7bf2c8bbb2b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const loginBox = document.getElementById("admin-login");
const panelBox = document.getElementById("admin-panel");
const loginError = document.getElementById("login-error");

// Login
document.getElementById("btn-login").addEventListener("click", () => {
  const email = document.getElementById("admin-email").value;
  const password = document.getElementById("admin-password").value;

  signInWithEmailAndPassword(auth, email, password)
    .catch((error) => {
      loginError.textContent = "Correo o contraseña incorrectos";
    });
});

// Logout
document.getElementById("btn-logout").addEventListener("click", () => {
  signOut(auth);
});

// Detectar si hay sesión activa
onAuthStateChanged(auth, (user) => {
  if (user) {
    loginBox.classList.add("hidden");
    panelBox.classList.remove("hidden");
    cargarProductosAdmin();
  } else {
    loginBox.classList.remove("hidden");
    panelBox.classList.add("hidden");
  }
});

function cargarProductosAdmin() {
  const contenedor = document.getElementById("productos-admin-list");

  onSnapshot(collection(db, "productos"), (snapshot) => {
    let html = "";
    snapshot.forEach((docSnap) => {
      const p = docSnap.data();
      const id = docSnap.id;
      html += `
        <div class="producto-admin-row">
          <img src="${p.imagenUrl}" alt="${p.nombre}">
          <div class="producto-admin-info">
            <strong>${p.nombre}</strong> (${p.categoria})
          </div>
          <label>Precio: <input type="number" value="${p.precio}" data-id="${id}" class="input-precio" /></label>
          <label><input type="checkbox" ${p.disponible ? "checked" : ""} data-id="${id}" class="input-disponible" /> Disponible</label>
        </div>
      `;
    });
    contenedor.innerHTML = html;

    // Eventos para guardar cambios
    document.querySelectorAll(".input-precio").forEach(input => {
      input.addEventListener("change", async (e) => {
        const id = e.target.dataset.id;
        await updateDoc(doc(db, "productos", id), { precio: Number(e.target.value) });
      });
    });

    document.querySelectorAll(".input-disponible").forEach(input => {
      input.addEventListener("change", async (e) => {
        const id = e.target.dataset.id;
        await updateDoc(doc(db, "productos", id), { disponible: e.target.checked });
      });
    });
  });
}