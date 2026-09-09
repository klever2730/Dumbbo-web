import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
// 1. IMPORTAR SERVICIOS DE FIREBASE STORAGE
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";

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
// 2. INICIALIZAR STORAGE
const storage = getStorage(app);

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

// AGREGAR NUEVO PRODUCTO A FIREBASE (CON CARGA DE IMAGEN EN STORAGE)
document.getElementById("form-crear-producto").addEventListener("submit", async (e) => {
  e.preventDefault();

  const archivoImagen = document.getElementById("nuevo-imagen").files[0];
  const btnGuardar = document.getElementById("btn-guardar");
  const mensajeCarga = document.getElementById("mensaje-carga");

  if (!archivoImagen) {
    alert("Por favor selecciona una imagen.");
    return;
  }

  try {
    // Deshabilitar botón para evitar múltiples envíos
    if (btnGuardar) btnGuardar.disabled = true;
    if (mensajeCarga) mensajeCarga.style.display = "inline";

    // 1. Subir la imagen a Firebase Storage en la carpeta 'productos/'
    const nombreArchivo = `${Date.now()}_${archivoImagen.name}`;
    const storageRef = ref(storage, `productos/${nombreArchivo}`);
    const snapshot = await uploadBytes(storageRef, archivoImagen);

    // 2. Obtener la URL pública de la imagen
    const imagenUrl = await getDownloadURL(snapshot.ref);

    // 3. Crear el objeto del producto con la URL obtenida
    const nuevoProducto = {
      nombre: document.getElementById("nuevo-nombre").value.trim(),
      categoria: document.getElementById("nuevo-categoria").value.trim(),
      precio: Number(document.getElementById("nuevo-precio").value),
      imagenUrl: imagenUrl,
      descripcion: document.getElementById("nuevo-descripcion").value.trim(),
      disponible: document.getElementById("nuevo-disponible").checked,
      promocion: document.getElementById("nuevo-promocion").checked
    };

    // 4. Guardar en Firestore
    await addDoc(collection(db, "productos"), nuevoProducto);

    document.getElementById("form-crear-producto").reset();
    document.getElementById("nuevo-disponible").checked = true;
    alert("¡Producto e imagen agregados exitosamente a Firebase!");
  } catch (error) {
    alert("Error al guardar el producto: " + error.message);
  } finally {
    if (btnGuardar) btnGuardar.disabled = false;
    if (mensajeCarga) mensajeCarga.style.display = "none";
  }
});

// RENDERIZAR LISTA EN EL PANEL ADMIN
function renderizarListaAdmin(lista) {
  const contenedor = document.getElementById("productos-admin-list");
  let html = "";
  
  lista.forEach((p) => {
    // Formatear precio para mejor lectura (ejemplo: $2.500)
    const precioFormateado = p.precio ? p.precio.toLocaleString("es-CL") : "0";

    html += `
      <div class="producto-admin-row" id="producto-row-${p.id}">
        <img src="${p.imagenUrl || 'https://via.placeholder.com/60'}" alt="${p.nombre}">
        
        <div class="producto-admin-info">
          <strong>${p.nombre}</strong> (${p.categoria})
          ${p.descripcion ? `<small>${p.descripcion}</small>` : ''}
          
          <!-- Vista normal del precio como texto estático -->
          <div class="precio-contenedor">
            <span class="precio-texto"><strong>Precio:</strong> $${precioFormateado}</span>
            <div class="precio-editar-box hidden">
              <input type="number" value="${p.precio}" data-id="${p.id}" class="input-precio-edit" />
              <button data-id="${p.id}" class="btn-guardar-precio">Guardar</button>
              <button data-id="${p.id}" class="btn-cancelar-precio">X</button>
            </div>
          </div>
        </div>

        <div class="producto-admin-controles">
          <label><input type="checkbox" ${p.disponible ? "checked" : ""} data-id="${p.id}" class="input-disponible" /> Disponible</label>
          <label><input type="checkbox" ${p.promocion ? "checked" : ""} data-id="${p.id}" class="input-promocion" /> Promoción</label>
        </div>

        <!-- Grupo de botones de acción -->
        <div class="acciones-btn-group">
          <button data-id="${p.id}" class="btn-editar-precio">Editar Precio</button>
          <button data-id="${p.id}" data-nombre="${p.nombre}" class="btn-eliminar">Eliminar</button>
        </div>
      </div>
    `;
  });
  contenedor.innerHTML = html;

  // EVENTO: Mostrar campo para editar precio
  document.querySelectorAll(".btn-editar-precio").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = e.target.dataset.id;
      const row = document.getElementById(`producto-row-${id}`);
      row.querySelector(".precio-texto").classList.add("hidden");
      row.querySelector(".precio-editar-box").classList.remove("hidden");
    });
  });

  // EVENTO: Cancelar edición de precio
  document.querySelectorAll(".btn-cancelar-precio").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = e.target.dataset.id;
      const row = document.getElementById(`producto-row-${id}`);
      row.querySelector(".precio-texto").classList.remove("hidden");
      row.querySelector(".precio-editar-box").classList.add("hidden");
    });
  });

  // EVENTO: Guardar nuevo precio en Firestore
  document.querySelectorAll(".btn-guardar-precio").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      const row = document.getElementById(`producto-row-${id}`);
      const nuevoPrecio = Number(row.querySelector(".input-precio-edit").value);

      if (isNaN(nuevoPrecio) || nuevoPrecio < 0) {
        alert("Por favor ingresa un precio válido.");
        return;
      }

      try {
        await updateDoc(doc(db, "productos", id), { precio: nuevoPrecio });
      } catch (error) {
        alert("Error al actualizar el precio: " + error.message);
      }
    });
  });

  // EVENTOS DE DISPONIBLE Y PROMOCIÓN
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

// CIERRE DE SESIÓN AUTOMÁTICO POR INACTIVIDAD
const TIEMPO_INACTIVIDAD_MS = 5 * 60 * 1000; // 5 minutos
let timerInactividad;

function reiniciarTimerInactividad() {
  clearTimeout(timerInactividad);
  timerInactividad = setTimeout(() => {
    if (auth.currentUser) {
      signOut(auth);
      alert("Sesión cerrada por inactividad");
    }
  }, TIEMPO_INACTIVIDAD_MS);
}

["mousemove", "keydown", "click", "scroll", "touchstart"].forEach(evento => {
  document.addEventListener(evento, reiniciarTimerInactividad);
});

reiniciarTimerInactividad();
