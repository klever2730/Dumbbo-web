import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

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

let todosLosProductos = []; // guardamos todos los productos aquí

function crearCard(producto) {
  return `
    <article class="col-lg-3 col-md-4 col-sm-6 col-12 tm-gallery-item">
      <figure>
        <img src="${producto.imagenUrl}" alt="${producto.nombre}" class="img-fluid tm-gallery-img" />
        <figcaption>
          <h4 class="tm-gallery-title">${producto.nombre}${producto.promocion ? ' 🔥' : ''}</h4>
          <p class="tm-gallery-description">${producto.descripcion}</p>
          <p class="tm-gallery-price">$${producto.precio}</p>
        </figcaption>
      </figure>
    </article>
  `;
}

function renderizarProductos(lista) {
  const contenedor = document.getElementById("menu-container");
  contenedor.innerHTML = lista.map(crearCard).join("");
}

function crearBotonesCategorias(productos) {
  const categorias = [...new Set(productos.map(p => p.categoria))]; // categorías únicas
  const nav = document.getElementById("categoria-nav");

  let html = `<li class="tm-paging-item"><a href="#" class="tm-paging-link active" data-categoria="todos">Todos</a></li>`;
  categorias.forEach(cat => {
    html += `<li class="tm-paging-item"><a href="#" class="tm-paging-link" data-categoria="${cat}">${cat}</a></li>`;
  });
  nav.innerHTML = html;

  // Evento click en cada botón
  document.querySelectorAll('.tm-paging-link').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.tm-paging-link').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const catSeleccionada = btn.dataset.categoria;
      if (catSeleccionada === "todos") {
        renderizarProductos(todosLosProductos);
      } else {
        renderizarProductos(todosLosProductos.filter(p => p.categoria === catSeleccionada));
      }
    });
  });
}

// Escuchar cambios en tiempo real desde Firestore
onSnapshot(collection(db, "productos"), (snapshot) => {
  todosLosProductos = [];
  snapshot.forEach((doc) => {
    const producto = doc.data();
    if (producto.disponible) {
      todosLosProductos.push(producto);
    }
  });

  crearBotonesCategorias(todosLosProductos);
  renderizarProductos(todosLosProductos);
});
