const usuarios = require("./users.json");
let locations = require("./locations.json")


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

function addLocation(location){
    location.id = locations.length + 1;
    locations.push(location);
}

function removeLocation(locationID) {
    locationID = Number(locationID);
    const initialLength = locations.length;
    
    locations = locations.filter(obj => obj.id !== locationID);

    if (locations.length === initialLength) {
        console.log("❌ No location found with ID:", locationID);
    } else {
        console.log("✅ Location removed:", locationID);
    }
}


function editLocation(id, updatedData) {
    let location = locations.find(obj => obj.id === id);
    if (location) {
        Object.assign(location, updatedData);
        return { success: true, location };
    } else {
        console.log("❌ No se encontró una ubicación con el ID:", id);
        return { success: false, error: "Location not found" };
    }
}


module.exports = {
    iniciarSesion,
    addLocation,
    removeLocation,
    editLocation,
    getLocations
};
