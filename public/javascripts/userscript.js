document.addEventListener("DOMContentLoaded", function () {

    const filtroGuardado = sessionStorage.getItem("filtroCategoria") || "todos";
    document.getElementById("filtroCategoria").value = filtroGuardado;
    var tableElement = $('#tablaPuntos');

    var map = L.map('map').setView([36.7213, -4.4213], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    function cargarPuntos() {
        let puntosGuardados = sessionStorage.getItem('puntosDeInteres');
        return puntosGuardados ? JSON.parse(puntosGuardados) : [
            { id: 1, lat: 36.7197, lng: -4.4200, titulo: "Museo Picasso", descripcion: "Museo dedicado a Pablo Picasso.", imagen: "./images/picasso.jpg", tipo: "Museo" },
            { id: 2, lat: 36.7213, lng: -4.4149, titulo: "Museo de Málaga", descripcion: "Museo de arte y arqueología.", imagen: "./images/museomalaga.jpg", tipo: "Museo" },
            { id: 3, lat: 36.7190, lng: -4.4158, titulo: "Cine Albéniz", descripcion: "Histórico cine de Málaga.", imagen: "./images/albeniz.jpg", tipo: "Punto de interés" }
        ];
    }

    let puntosDeInteres = cargarPuntos();

    function savePoints() {
        sessionStorage.setItem('puntosDeInteres', JSON.stringify(puntosDeInteres));
    }

    let markers = [];

    function agregarMarcadores() {
        markers.forEach(marker => map.removeLayer(marker));
        markers = [];

        const categoriaSeleccionada = sessionStorage.getItem('filtroCategoria') || "todos";

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
            imageWidth: 500,  // Enlarged width
            imageHeight: 400, // Enlarged height
            imageAlt: titulo,
            showCloseButton: true,
            showConfirmButton: false // Hide confirm button
        });
    }

    //Realizamos estas funciones en el momento en el que carga la pagina
    agregarMarcadores();
    filtrarTabla();

});