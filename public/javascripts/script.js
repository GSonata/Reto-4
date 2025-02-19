document.addEventListener("DOMContentLoaded", function () {

    let markers = [];
    let puntosDeInteres = [];

    function cargarPuntos() {
        return fetch("/cargar")
            .then(response => {
                if (!response.ok) {
                    throw new Error("Error fetching data");
                }
                return response.json();
            })
            .then(data => {
                puntosDeInteres = data;
                console.log("Puntos de interés cargados:", puntosDeInteres);
                return puntosDeInteres;
            })
            .catch(error => {
                console.error("Error cargando los puntos:", error);
                throw error;
            });
    }

    cargarPuntos().then(data => {
        filtrarTabla();
        agregarMarcadores();
    }).catch(error => {
        console.error("Error initializing data:", error);
    });

    //Cargamos los elementos principales al cargar la pagina.
    const filtroGuardado = sessionStorage.getItem("filtroCategoria") || "todos";
    document.getElementById("filtroCategoria").value = filtroGuardado;
    var tableElement = $('#tablaPuntos');

    //Por defecto el mapa se centra en Malaga
    var map = L.map('map').setView([36.7213, -4.4213], 15);

    //Añadimos las tiles de OpenMaps
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    //muestra los puntos en el mapa
    function agregarMarcadores() {
        markers.forEach(marker => map.removeLayer(marker));
        markers = [];

        const categoriaSeleccionada = sessionStorage.getItem('filtroCategoria') || "todos";

        console.log("Dentro de agregarMarcadores: " + puntosDeInteres);
        puntosDeInteres.forEach(punto => {
            if (categoriaSeleccionada === "todos" || punto.tipo.toLowerCase() === categoriaSeleccionada.toLowerCase()) {
                let marker = L.marker([punto.lat, punto.lng])
                    .addTo(map)
                    .bindPopup(`
                        <b>📍${punto.titulo}</b><br>
                        <i>${punto.descripcion}</i><br>
                        <img src="${punto.imagen}" width="100" height="70" class="img-fluid" 
                        onclick="mostrarImagen('${punto.imagen}', '${punto.titulo}')" 
                        alt="${punto.titulo}"><br>                        
                        <i>${punto.tipo}</i><br>
                        <b><span style="color:red">Latitud</span>:</b> ${punto.lat.toFixed(6)}<br>
                        <b><span style="color:red">Longitud</span>:</b> ${punto.lng.toFixed(6)}
                    `);
                markers.push(marker);
            }
        });
    }


    //GUARDAR EL FILTRO EN LA SESSION, cambiar los marcadores y la tabla:
    document.getElementById("filtroCategoria").addEventListener("change", function () {
        const categoriaSeleccionada = this.value.toLowerCase();
        sessionStorage.setItem("filtroCategoria", categoriaSeleccionada);

        agregarMarcadores();
        filtrarTabla();
    });

    //eliminar puntos
    window.eliminarPunto = function (id) {
        Swal.fire({
            title: "¿Estás seguro?",
            text: "Este punto se eliminará permanentemente.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar"
        }).then((result) => {
            if (result.isConfirmed) {
                fetch("/eliminar", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ id })
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            cargarPuntos().then(() => {
                                agregarMarcadores();
                                filtrarTabla();
                            });

                            Swal.fire("Eliminado", "El punto de interés ha sido eliminado con éxito.", "success");
                        } else {
                            Swal.fire("Error", "No se pudo eliminar el punto de interés.", "error");
                        }
                    })
                    .catch(error => {
                        console.error("Error eliminando el punto:", error);
                        Swal.fire("Error", "Hubo un problema con la eliminación.", "error");
                    });
            }
        });
    };

    //editar un punto
    window.editarPunto = function (id) {
        let punto = puntosDeInteres.find((p) => p.id === id);
        if (!punto) return;
    
        Swal.fire({
            title: "Editar Punto de Interés",
            html: `
            <div class="container">
                <div class="row">
                    <div class="col-12 mb-2">
                        <label class="form-label fw-bold">Nombre del Lugar</label>
                        <input id="editNombre" class="form-control" value="${punto.titulo}">
                    </div>
                    <div class="col-12 mb-2">
                        <label class="form-label fw-bold">Descripción</label>
                        <input id="editDescripcion" class="form-control" value="${punto.descripcion}">
                    </div>
                    <div class="col-md-6 mb-2">
                        <label class="form-label fw-bold">Latitud</label>
                        <input id="editLat" class="form-control" value="${punto.lat.toFixed(6)}">
                    </div>
                    <div class="col-md-6 mb-2">
                        <label class="form-label fw-bold">Longitud</label>
                        <input id="editLng" class="form-control" value="${punto.lng.toFixed(6)}">
                    </div>
                    <div class="col-12 mb-2">
                        <label class="form-label fw-bold">Categoría</label>
                        <select id="editTipo" class="form-select">
                            <option value="museo" ${punto.tipo === "museo" ? "selected" : ""}>Museo</option>
                            <option value="parque" ${punto.tipo === "parque" ? "selected" : ""}>Parque Natural</option>
                            <option value="punto de interés" ${punto.tipo === "punto de interés" ? "selected" : ""}>Punto de Interés</option>
                            <option value="restaurante" ${punto.tipo === "restaurante" ? "selected" : ""}>Restaurante</option>
                        </select>
                    </div>
                    <div class="col-12 mb-2">
                        <label class="form-label fw-bold">Imagen</label>
                        <input type="file" id="editImagen" class="form-control">
                    </div>
                </div>
            </div>
            `,
            showCancelButton: true,
            confirmButtonText: "Guardar Cambios",
            preConfirm: () => {
                return new Promise((resolve, reject) => {
                    const fileInput = document.getElementById("editImagen");
                    const formData = new FormData();
    
                    if (fileInput.files.length > 0) {
                        formData.append("image", fileInput.files[0]);
    
                        fetch("/upload", {
                            method: "POST",
                            body: formData,
                        })
                            .then((response) => response.json())
                            .then((data) => {
                                if (!data.imageUrl) throw new Error("Image upload failed");
    
                                resolve({
                                    id: id,
                                    titulo: document.getElementById("editNombre").value,
                                    descripcion: document.getElementById("editDescripcion").value,
                                    lat: parseFloat(document.getElementById("editLat").value),
                                    lng: parseFloat(document.getElementById("editLng").value),
                                    tipo: document.getElementById("editTipo").value,
                                    imagen: data.imageUrl,
                                });
                            })
                            .catch((error) => {
                                console.error("Error uploading image:", error);
                                Swal.showValidationMessage("Error uploading image. Please try again.");
                                reject();
                            });
                    } else {
                        resolve({
                            id: id,
                            titulo: document.getElementById("editNombre").value,
                            descripcion: document.getElementById("editDescripcion").value,
                            lat: parseFloat(document.getElementById("editLat").value),
                            lng: parseFloat(document.getElementById("editLng").value),
                            tipo: document.getElementById("editTipo").value,
                            imagen: punto.imagen,
                        });
                    }
                });
            },
        }).then((result) => {
            if (result.isConfirmed && result.value) {
                fetch("/edit", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(result.value),
                })
                    .then((res) => res.json())
                    .then((data) => {
                        if (data.success) {
                            Object.assign(punto, result.value);
    
                            map.eachLayer((layer) => {
                                if (layer instanceof L.Marker) {
                                    map.removeLayer(layer);
                                }
                            });
    
                            let table = $("#tablaPuntos").DataTable();
                            table.clear().rows.add(puntosDeInteres).draw();
    
                            Swal.fire("Guardado", "El punto ha sido actualizado.", "success");
    
                            cargarPuntos().then(() => {
                                agregarMarcadores(); 
                                filtrarTabla();
                            });
    
                        } else {
                            Swal.fire("Error", "No se pudo actualizar el punto.", "error");
                        }
                    })
                    .catch((error) => {
                        console.error("Error updating location:", error);
                        Swal.fire("Error", "Error en la actualización.", "error");
                    });
            } else {
                console.warn("❌ Edición cancelada o datos inválidos.");
            }
        });
    };
    
    // AGREGAR NUEVO PUNTO DE INTERÉS
    map.on('click', function (e) {
        Swal.fire({
            title: 'Agregar Nuevo Punto de Interés',
            html: `
            <div class="container text-start">
                <p><strong>Coordenadas:</strong> ${e.latlng.lat.toFixed(6)}, ${e.latlng.lng.toFixed(6)}</p>
                <input id="nombreLugar" class="form-control mb-2" placeholder="Nombre del Lugar">
                <textarea id="descripcionLugar" class="form-control mb-2" placeholder="Descripción"></textarea>
    
                <label class="form-label mt-2">Categoría</label>
                <select id="tipoLugar" class="form-select mb-2">
                    <option value="museo">Museo</option>
                    <option value="parque">Parque Natural</option>
                    <option value="punto de interés">Punto de Interés</option>
                    <option value="restaurante">Restaurante</option>
                </select>
    
                <label class="form-label mt-2">Imagen</label>
                <input type="file" id="imagenLugar" class="form-control">
            </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Agregar',
            customClass: {
                popup: 'p-3 rounded-lg shadow-lg',
                title: 'text-primary',
                confirmButton: 'btn btn-primary',
                cancelButton: 'btn btn-secondary'
            },
            preConfirm: () => {
                return new Promise((resolve, reject) => {
                    const fileInput = document.getElementById("imagenLugar");
                    const formData = new FormData();

                    if (fileInput.files.length > 0) {
                        formData.append("image", fileInput.files[0]);

                        fetch("/upload", {
                            method: "POST",
                            body: formData
                        })
                            .then(response => response.json())
                            .then(data => {
                                resolve({
                                    titulo: document.getElementById('nombreLugar').value,
                                    descripcion: document.getElementById('descripcionLugar').value,
                                    tipo: document.getElementById('tipoLugar').value,
                                    lat: e.latlng.lat,
                                    lng: e.latlng.lng,
                                    imagen: data.imageUrl,
                                });
                            })
                            .catch(error => {
                                console.error("Error uploading image:", error);
                                reject("Error uploading image");
                            });
                    } else {
                        resolve({
                            titulo: document.getElementById('nombreLugar').value,
                            descripcion: document.getElementById('descripcionLugar').value,
                            tipo: document.getElementById('tipoLugar').value,
                            lat: e.latlng.lat,
                            lng: e.latlng.lng,
                            imagen: "./images/default.jpg"
                        });
                    }
                });
            }
        }).then((result) => {
            if (result.isConfirmed) {
                fetch("/add", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(result.value)
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            Swal.fire("Éxito", "Punto de interés agregado correctamente", "success");
                            cargarPuntos().then(data => {
                                filtrarTabla();
                                agregarMarcadores();
                            }).catch(error => {
                                console.error("Error initializing data:", error);
                            });
                        } else {
                            Swal.fire("Error", "No se pudo agregar el punto de interés", "error");
                        }
                    })
                    .catch(error => {
                        console.error("Error adding location:", error);
                        Swal.fire("Error", "Error al comunicarse con el servidor", "error");
                    });
            }
        });
    });

    if (!$.fn.DataTable.isDataTable(tableElement)) {
        tableElement.DataTable({
            "paging": false,
            "searching": true,
            "ordering": false,
            "info": false,
            "dom": "<'row'<'col-sm-6'l><'col-sm-6 text-end'f>>" +
                "<'row'<'col-sm-12'tr>>" +
                "<'row'<'col-sm-5'i><'col-sm-7'p>>",
            "language": {
                "search": "",
                "searchPlaceholder": "🔎 Buscar",
                "emptyTable": "No hay resultados"
            },
            "data": puntosDeInteres,
            "columns": [
                { "data": "id", "title": "ID" },
                { "data": "titulo", "title": "Ubicación" },
                { "data": "descripcion", "title": "Descripción" },
                { "data": "tipo", "title": "Tipo de Punto" },
                {
                    "data": "imagen", "title": "Imagen", "render": function (data, type, row) {
                        return `<img src="${data}" class="img-thumbnail zoom-img" width="50" height="50" 
                alt="${row.titulo}" onclick="mostrarImagen('${data}', '${row.titulo}')">`;
                    }
                },
                {
                    "data": null, "title": "Coordenadas", "render": function (data, type, row) {
                        return `${row.lat.toFixed(6)}, ${row.lng.toFixed(6)}`;
                    }
                },
                {
                    "data": null, "title": "Acciones", "render": function (data, type, row) {
                        return `
                            <button class="btn btn-warning btn-sm editar-btn" onClick='editarPunto(${row.id})'>Editar</button>
                            <button class="btn btn-danger btn-sm borrar-btn" onClick='eliminarPunto(${row.id})'>Borrar</button>
                        `;
                    }
                }
            ],
            "createdRow": function (row, data) {
                $(row).find(".borrar-btn").on("click", function () {
                    eliminarPunto(data.id);
                });
            }
        });
    }

    function filtrarTabla() {
        const categoriaSeleccionada = sessionStorage.getItem('filtroCategoria') || "todos";

        let table = $('#tablaPuntos').DataTable();

        table.clear();

        let filteredData = puntosDeInteres.filter(punto =>
            categoriaSeleccionada === "todos" || punto.tipo.toLowerCase() === categoriaSeleccionada.toLowerCase()
        );

        table.rows.add(filteredData).draw();
    }

    //funcion de Havarsine
    function calcularDistancia(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radio de la Tierra en km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distancia en km
    }

    //obtenemos la localizacion actual con geolocation y calculamos la distancia hasta el punto mas cercano
    window.encontrarPuntoMasCercano = function () {
        if (!navigator.geolocation) {
            Swal.fire("Error", "Tu navegador no soporta geolocalización.", "error");
            return;
        }

        navigator.geolocation.getCurrentPosition(position => {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;

            let puntoMasCercano = null;
            let distanciaMinima = Infinity;

            puntosDeInteres.forEach(punto => {
                const distancia = calcularDistancia(userLat, userLng, punto.lat, punto.lng);
                if (distancia < distanciaMinima) {
                    distanciaMinima = distancia;
                    puntoMasCercano = punto;
                }
            });

            if (puntoMasCercano) {
                Swal.fire({
                    title: "📍 Punto de Interés Más Cercano",
                    html: `
                        <b>${puntoMasCercano.titulo}</b><br>
                        ${puntoMasCercano.descripcion}<br>
                        <b>Tipo:</b> ${puntoMasCercano.tipo}<br>
                        <b>Distancia:</b> ${distanciaMinima.toFixed(2)} km<br>
                        <img src="${puntoMasCercano.imagen}" width="150" height="100" class="img-fluid"
                        onclick="mostrarImagen('${puntoMasCercano.imagen}', '${puntoMasCercano.titulo}')"
                        alt="${puntoMasCercano.titulo}"><br>
                        <b><span style="color:red">Latitud</span>:</b> ${puntoMasCercano.lat.toFixed(6)}<br>
                        <b><span style="color:red">Longitud</span>:</b> ${puntoMasCercano.lng.toFixed(6)}
                    `,
                    confirmButtonText: "Ver en el Mapa"
                }).then(() => {
                    map.setView([puntoMasCercano.lat, puntoMasCercano.lng], 17); // Centrar en el punto más cercano

                    L.marker([puntoMasCercano.lat, puntoMasCercano.lng], { color: "red" })
                        .addTo(map)
                        .bindPopup(`<b>${puntoMasCercano.titulo}</b><br>${puntoMasCercano.descripcion}`)
                        .openPopup();
                });
            }
        }, error => {
            Swal.fire("Error", "No se pudo obtener tu ubicación.", "error");
        });
    }

    //FUNCION PARA AUMENTAR EL TAMAÑO DE LAS FOTOS
    window.mostrarImagen = function (src, titulo) {
        Swal.fire({
            title: titulo,
            imageUrl: src,
            imageWidth: 500, 
            imageHeight: 400, 
            imageAlt: titulo,
            showCloseButton: true,
            showConfirmButton: false
        });
    }

});