const usuarios = require("./users.json");

function iniciarSesion(nombre, contraseña) {

    nombre = nombre.toLowerCase();

    console.log("🔍 Buscando usuario:", nombre);


    let usuarioEncontrado = usuarios.find(

        (u) => u.nombre.toLowerCase() === nombre && u.contraseña === contraseña
    );

    return usuarioEncontrado || null; // ✅ 
}

module.exports = {
    iniciarSesion,
};
