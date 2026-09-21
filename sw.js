// =====================================================
// DUMBBBO CAFÉ - CACHE DE IMÁGENES
// Solo intercepta y guarda imágenes.
// No modifica Firestore, Firebase Storage ni la lógica del menú.
// =====================================================

const CACHE_IMAGENES = "dumbbo-imagenes-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", event => {
  const request = event.request;

  // Solo trabajamos con solicitudes GET de imágenes.
  if (request.method !== "GET" || request.destination !== "image") {
    return;
  }

  event.respondWith(
    caches.open(CACHE_IMAGENES).then(async cache => {
      const imagenEnCache = await cache.match(request);

      // Si ya existe, se muestra directamente desde la caché.
      if (imagenEnCache) {
        return imagenEnCache;
      }

      try {
        const respuesta = await fetch(request);

        // Guardamos respuestas válidas y también respuestas opacas
        // para permitir caché de imágenes externas compatibles.
        if (respuesta.ok || respuesta.type === "opaque") {
          cache.put(request, respuesta.clone()).catch(() => {});
        }

        return respuesta;
      } catch (error) {
        // Si no hay Internet pero existe una copia cacheada con otra
        // coincidencia disponible, intentamos recuperarla.
        const respaldo = await cache.match(request);
        if (respaldo) return respaldo;
        throw error;
      }
    })
  );
});
