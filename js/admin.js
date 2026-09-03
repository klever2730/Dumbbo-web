import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
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

let todosLosProductosAdmin = [];

const loginBox = document.getElementById("admin-login");
const panelBox = document.getElementById("admin-panel");
const loginError = document.getElementById("login-error");

// AUTHENTICATION
document.getElementById("btn-login").addEventListener("click", () => {
  const email = document.getElementById("admin-email").value;
  const password = document.getElementById("admin-password").value;
  signInWithEmailAndPassword(auth, email, password)
    .catch(() => { loginError.textContent = "Correo o contraseña incorrectos"; });
});

document.getElementById("btn-logout").addEventListener("click", () => signOut(auth));

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

// AGREGAR NUEVO PRODUCTO A FIREBASE
document.getElementById("form-crear-producto").addEventListener("submit", async (e) => {
  e.preventDefault();

  const nuevoProducto = {
    nombre: document.getElementById("nuevo-nombre").value.trim(),
    categoria: document.getElementById("nuevo-categoria").value.trim(),
    precio: Number(document.getElementById("nuevo-precio").value),
    imagenUrl: document.getElementById("nuevo-imagen").value.trim(),
    descripcion: document.getElementById("nuevo-descripcion").value.trim(),
    disponible: document.getElementById("nuevo-disponible").checked,
    promocion: document.getElementById("nuevo-promocion").checked
  };

  try {
    await addDoc(collection(db, "productos"), nuevoProducto);
    document.getElementById("form-crear-producto").reset();
    document.getElementById("nuevo-disponible").checked = true;
    alert("¡Producto agregado exitosamente a Firebase!");
  } catch (error) {
    alert("Error al guardar el producto: " + error.message);
  }
});

// RENDERIZAR LISTA EN EL PANEL ADMIN
function renderizarListaAdmin(lista) {
  const contenedor = document.getElementById("productos-admin-list");
  let html = "";
  lista.forEach((p) => {
    html += `
      <div class="producto-admin-row">
        <img src="${p.imagenUrl || 'https://via.placeholder.com/60'}" alt="${p.nombre}">
        <div class="producto-admin-info">
          <strong>${p.nombre}</strong> (${p.categoria})
          ${p.descripcion ? `<small>${p.descripcion}</small>` : ''}
        </div>
        <label>Precio: <input type="number" value="${p.precio}" data-id="${p.id}" class="input-precio" /></label>
        <label><input type="checkbox" ${p.disponible ? "checked" : ""} data-id="${p.id}" class="input-disponible" /> Disponible</label>
        <label><input type="checkbox" ${p.promocion ? "checked" : ""} data-id="${p.id}" class="input-promocion" /> Promoción</label>
        <button data-id="${p.id}" data-nombre="${p.nombre}" class="btn-eliminar">Eliminar</button>
      </div>
    `;
  });
  contenedor.innerHTML = html;

  // EVENTOS DE ACTUALIZACIÓN EN TIEMPO REAL
  document.querySelectorAll(".input-precio").forEach(input => {
    input.addEventListener("change", async (e) => {
      await updateDoc(doc(db, "productos", e.target.dataset.id), { precio: Number(e.target.value) });
    });
  });

  document.querySelectorAll(".input-disponible").forEach(input => {
    input.addEventListener("change", async (e) => {
      await updateDoc(doc(db, "productos", e.target.dataset.id), { disponible: e.target.checked });
    });
  });

  document.querySelectorAll(".input-promocion").forEach(input => {
    input.addEventListener("change", async (e) => {
      await updateDoc(doc(db, "productos", e.target.dataset.id), { promocion: e.target.checked });
    });
  });

  // EVENTO DE ELIMINACIÓN
  document.querySelectorAll(".btn-eliminar").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      const nombre = e.target.dataset.nombre;

      if (confirm(`¿Estás seguro de que deseas eliminar "${nombre}"?`)) {
        try {
          await deleteDoc(doc(db, "productos", id));
        } catch (error) {
          alert("Error al eliminar: " + error.message);
        }
      }
    });
  });
}

// FILTROS DE NAVEGACIÓN
function crearFiltrosAdmin(productos) {
  const categorias = [...new Set(productos.map(p => p.categoria))];
  const nav = document.getElementById("admin-categoria-nav");

  let html = `<button class="filtro-admin-btn active" data-categoria="todos">Todos (${productos.length})</button>`;
  categorias.forEach(cat => {
    const cantidad = productos.filter(p => p.categoria === cat).length;
    html += `<button class="filtro-admin-btn" data-categoria="${cat}">${cat} (${cantidad})</button>`;
  });
  nav.innerHTML = html;

  document.querySelectorAll(".filtro-admin-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filtro-admin-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const cat = btn.dataset.categoria;
      const filtrados = cat === "todos" ? todosLosProductosAdmin : todosLosProductosAdmin.filter(p => p.categoria === cat);
      renderizarListaAdmin(filtrados);
    });
  });
}

// OBTIENE PRODUCTOS EN TIEMPO REAL DESDE FIREBASE
function cargarProductosAdmin() {
  onSnapshot(collection(db, "productos"), (snapshot) => {
    todosLosProductosAdmin = [];
    snapshot.forEach((docSnap) => {
      todosLosProductosAdmin.push({ id: docSnap.id, ...docSnap.data() });
    });
    crearFiltrosAdmin(todosLosProductosAdmin);
    renderizarListaAdmin(todosLosProductosAdmin);
  });
}
