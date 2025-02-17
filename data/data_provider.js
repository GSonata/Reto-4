const usuarios = require("./users.json");
const locations = require("./locations.json")


function iniciarSesion(nombre, contraseña) {

    nombre = nombre.toLowerCase();

    console.log("🔍 Buscando usuario:", nombre);


    let usuarioEncontrado = usuarios.find(

        (u) => u.nombre.toLowerCase() === nombre && u.contraseña === contraseña
    );

    return usuarioEncontrado || null; // ✅ 
}

function getLocations(){
    return locations;
}

function addLocation(newLocation){
    locations.push(newLocation);
}

function removeLocation(locationID) {
    locations = locations.filter(obj => obj.id !== locationID);
}

function editLocation(id, updatedData) {
    let location = locations.find(obj => obj.id === id);
    if (location) {
        Object.assign(location, updatedData); // Actualiza solo las propiedades que se pasan
    } else {
        console.log("❌ No se encontró una ubicación con el ID:", id);
    }
}


module.exports = {
    iniciarSesion,
    addLocation,
    removeLocation,
    editLocation,
    getLocations
};
