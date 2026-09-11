import {
	initializeApp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";

import {
	getAuth,
	signInWithEmailAndPassword,
	signOut,
	onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

import {
	getFirestore,
	collection,
	addDoc,
	onSnapshot,
	doc,
	updateDoc,
	deleteDoc
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

import {
	getStorage,
	ref,
	uploadBytes,
	getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";


const firebaseConfig = {
	apiKey: "AIzaSyDEhG5JEj8s2GMQgdceHY3LeUa_32jx_MI",
	authDomain: "dumbbo-menu.firebaseapp.com",
	projectId: "dumbbo-menu",
	storageBucket: "dumbbo-menu.firebasestorage.app",
	messagingSenderId: "875230670130",
	appId: "1:875230670130:web:63ad4fb93cb7bf2c8bbb2b"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

let listaProductosCache = [];
let filtroActual = "todos";

const categoriasBase = [
	"Bebestibles",
	"Cafetería",
	"Dulces",
	"Pasteles",
	"Snacks",
	"Sandwich",
	"Promociones"
];


// AUTENTICACIÓN

onAuthStateChanged(auth, (user) => {

	if (user) {

		document.getElementById("admin-login").classList.add("hidden");
		document.getElementById("admin-panel").classList.remove("hidden");

	} else {

		document.getElementById("admin-login").classList.remove("hidden");
		document.getElementById("admin-panel").classList.add("hidden");

	}

});


document.getElementById("btn-login").addEventListener("click", async () => {

	const email = document.getElementById("admin-email").value;
	const pass = document.getElementById("admin-password").value;

	try {

		await signInWithEmailAndPassword(auth, email, pass);

	} catch (err) {

		document.getElementById("login-error").innerText =
			"Error: Credenciales incorrectas.";

	}

});


document.getElementById("btn-logout").addEventListener("click", () => {
	signOut(auth);
});


// CATEGORÍAS

function actualizarCategorias() {

	const select = document.getElementById("nuevo-categoria");
	const categoriaActual = select.value;

	const categoriasFirebase = listaProductosCache
		.map(p => (p.categoria || "").trim())
		.filter(Boolean);

	const categorias = [
		...new Set([
			...categoriasBase,
			...categoriasFirebase
		])
	];

	select.innerHTML = "";

	const opcionInicial = document.createElement("option");
	opcionInicial.value = "";
	opcionInicial.textContent = "-- Seleccionar Categoría --";
	select.appendChild(opcionInicial);

	categorias.forEach(categoria => {

		const option = document.createElement("option");

		option.value = categoria;
		option.textContent = categoria;

		select.appendChild(option);

	});

	const opcionNueva = document.createElement("option");

	opcionNueva.value = "__nueva_categoria__";
	opcionNueva.textContent = "➕ Nueva categoría";

	select.appendChild(opcionNueva);

	if (
		categoriaActual === "__nueva_categoria__" ||
		categorias.includes(categoriaActual)
	) {
		select.value = categoriaActual;
	}

}


document.getElementById("nuevo-categoria").addEventListener("change", (e) => {

	const esNueva = e.target.value === "__nueva_categoria__";

	const contenedor =
		document.getElementById("nueva-categoria-container");

	const input =
		document.getElementById("nueva-categoria-input");

	contenedor.style.display = esNueva ? "block" : "none";

	input.required = esNueva;

	if (esNueva) {

		input.focus();

	} else {

		input.value = "";

	}

});


// LEER PRODUCTOS EN TIEMPO REAL

onSnapshot(collection(db, "productos"), (snapshot) => {

	listaProductosCache = [];

	snapshot.forEach((docSnap) => {

		listaProductosCache.push({
			id: docSnap.id,
			...docSnap.data()
		});

	});

	actualizarCategorias();
	renderizarTabla();

});


// RENDERIZAR TABLA

function renderizarTabla() {

	const tbody =
		document.getElementById("tabla-productos-body");

	tbody.innerHTML = "";

	const filtrados = listaProductosCache.filter(p => {

		if (filtroActual === "disponible") {
			return p.disponible;
		}

		if (filtroActual === "oculto") {
			return !p.disponible;
		}

		if (filtroActual === "oferta") {
			return p.promocion;
		}

		return true;

	});


	filtrados.forEach(p => {

		const tr = document.createElement("tr");

		tr.innerHTML = `

			<td>
				<img
					src="${p.imagenUrl || "img/logo.png"}"
					class="img-tabla"
					alt="${p.nombre}"
				>
			</td>

			<td>
				<strong>${p.nombre}</strong>
			</td>

			<td>
				${p.categoria || "-"}
			</td>

			<td>
				$${Number(p.precio).toLocaleString("es-CL")}
			</td>

			<td>

				<div class="badge-toggle-group">

					<span class="badge-estado ${
						p.disponible
							? "badge-disponible"
							: "badge-oculto"
					}">

						${
							p.disponible
								? "Disponible"
								: "Oculto"
						}

					</span>

					<input
						type="checkbox"
						class="chk-rapido"
						${p.disponible ? "checked" : ""}
						title="Marcar para mostrar / Desmarcar para ocultar"
						onchange="toggleDisponible('${p.id}', this.checked)"
					/>

				</div>

			</td>

			<td>

				<div class="badge-toggle-group">

					<span>
						${p.promocion ? "🔥 Sí" : "No"}
					</span>

					<input
						type="checkbox"
						class="chk-rapido"
						${p.promocion ? "checked" : ""}
						title="Activar / Desactivar oferta"
						onchange="togglePromocion('${p.id}', this.checked)"
					/>

				</div>

			</td>

			<td>

				<div style="display:flex; gap:6px;">

					<button
						class="btn-editar-tabla"
						onclick="cargarEdicion('${p.id}')">
						Editar
					</button>

					<button
						class="btn-eliminar-tabla"
						onclick="eliminarProducto('${p.id}')">
						Eliminar
					</button>

				</div>

			</td>

		`;

		tbody.appendChild(tr);

	});

}


// CAMBIOS RÁPIDOS

window.toggleDisponible = async (id, estado) => {

	await updateDoc(
		doc(db, "productos", id),
		{
			disponible: estado
		}
	);

};


window.togglePromocion = async (id, estado) => {

	await updateDoc(
		doc(db, "productos", id),
		{
			promocion: estado
		}
	);

};


// FILTRADO

window.filtrarTabla = (tipo, btn) => {

	filtroActual = tipo;

	document
		.querySelectorAll(".btn-apartado")
		.forEach(b => b.classList.remove("active"));

	btn.classList.add("active");

	renderizarTabla();

};


// CARGAR EDICIÓN

window.cargarEdicion = (id) => {

	const p =
		listaProductosCache.find(item => item.id === id);

	if (!p) return;

	document.getElementById("producto-id-edit").value = p.id;

	document.getElementById("nuevo-nombre").value =
		p.nombre || "";

	document.getElementById("nuevo-categoria").value =
		p.categoria || "";

	document.getElementById("nuevo-precio").value =
		p.precio || "";

	document.getElementById("nuevo-descripcion").value =
		p.descripcion || "";

	document.getElementById("nuevo-disponible").checked =
		p.disponible;

	document.getElementById("nuevo-promocion").checked =
		p.promocion;

	document.getElementById("imagen-actual-url").value =
		p.imagenUrl || "";

	document.getElementById("nueva-categoria-container").style.display =
		"none";

	document.getElementById("nueva-categoria-input").value = "";
	document.getElementById("nueva-categoria-input").required = false;

	document.getElementById("form-titulo").innerText =
		"✏️ Editar Producto";

	document.getElementById("btn-guardar").innerText =
		"Actualizar Producto";

	document.getElementById("btn-cancelar").style.display =
		"inline-block";

	window.scrollTo({
		top: 0,
		behavior: "smooth"
	});

};


// GUARDAR / ACTUALIZAR PRODUCTO

document
	.getElementById("form-crear-producto")
	.addEventListener("submit", async (e) => {

		e.preventDefault();

		const id =
			document.getElementById("producto-id-edit").value;

		const archivoInput =
			document.getElementById("nuevo-imagen");

		let urlImagenFinal =
			document.getElementById("imagen-actual-url").value;

		let categoria =
			document.getElementById("nuevo-categoria").value;


		if (categoria === "__nueva_categoria__") {

			categoria =
				document
					.getElementById("nueva-categoria-input")
					.value
					.trim();

			if (!categoria) {

				alert(
					"Escribe el nombre de la nueva categoría."
				);

				return;
			}

		}


		if (!categoria) {

			alert("Selecciona una categoría.");

			return;

		}


		document.getElementById("mensaje-carga").style.display =
			"inline";


		try {

			if (archivoInput.files.length > 0) {

				const file =
					archivoInput.files[0];

				const storageRef =
					ref(
						storage,
						`productos/${Date.now()}_${file.name}`
					);

				await uploadBytes(
					storageRef,
					file
				);

				urlImagenFinal =
					await getDownloadURL(storageRef);

			}


			const productoData = {

				nombre:
					document
						.getElementById("nuevo-nombre")
						.value,

				categoria: categoria,

				precio:
					Number(
						document
							.getElementById("nuevo-precio")
							.value
					),

				imagenUrl: urlImagenFinal,

				descripcion:
					document
						.getElementById("nuevo-descripcion")
						.value,

				disponible:
					document
						.getElementById("nuevo-disponible")
						.checked,

				promocion:
					document
						.getElementById("nuevo-promocion")
						.checked

			};


			if (id) {

				await updateDoc(
					doc(db, "productos", id),
					productoData
				);

			} else {

				await addDoc(
					collection(db, "productos"),
					productoData
				);

			}


			limpiarFormulario();


		} catch (error) {

			console.error(error);

			alert(
				"Error al guardar el producto."
			);

		} finally {

			document.getElementById("mensaje-carga").style.display =
				"none";

		}

	});


// ELIMINAR

window.eliminarProducto = async (id) => {

	if (
		confirm(
			"¿Estás seguro de que deseas eliminar este producto?"
		)
	) {

		await deleteDoc(
			doc(db, "productos", id)
		);

	}

};


// LIMPIAR FORMULARIO

window.limpiarFormulario = () => {

	document
		.getElementById("form-crear-producto")
		.reset();

	document.getElementById("producto-id-edit").value = "";

	document.getElementById("imagen-actual-url").value = "";

	document.getElementById("form-titulo").innerText =
		"+ Agregar Nuevo Producto";

	document.getElementById("btn-guardar").innerText =
		"Guardar Producto en Firebase";

	document.getElementById("btn-cancelar").style.display =
		"none";

	document.getElementById("nueva-categoria-container").style.display =
		"none";

	document.getElementById("nueva-categoria-input").value = "";

	document.getElementById("nueva-categoria-input").required =
		false;

};
