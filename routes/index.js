var express = require('express');
var router = express.Router();
var funciones = require("../data/data_provider.js");


/* GET Login Page */
router.get('/', function (req, res, next) {
  if (req.session.login) {
    const userActivo = req.session.user;
    if (userActivo.rol === "administrador") {
      return res.render("index");
    }
    return res.render("paginaUser" , {userActivo : req.session.user});
  }
  res.redirect('/login');
});

/* GET */
router.get('/login', function (req, res, next) {
  if (req.session.login) {
    const userActivo = req.session.user;
    return res.redirect("/"); 
  }
  res.render('login', { error: null, status:null });
});

/* POST Login */
router.post("/login", function (req, res, next) {
  const user = req.body.username;
  const pass = req.body.password;

  if (!user || !pass) {
    console.log("❌ Uno de los campos está vacío");
    return res.render("login", { error: "⚠️ Usuario y contraseña son obligatorios." });
  }

  const userActivo = funciones.iniciarSesion(user, pass);

  console.log("🔹 Usuario encontrado:", userActivo);

  if (userActivo) {
    req.session.login = true;
    req.session.user = userActivo;
    return res.redirect("/"); 
  }

  return res.render("login", { error: "❌ Usuario o contraseña incorrectos", status: null });
});

/* Logout */
router.post('/logout', function (req, res) {
  req.session.login = false;
  req.session.user = null;
  return res.render("login", { status: "👋 Sesión Cerrada 👋", error: null });
});

/* FUNCIONES */

router.get("/cargar", (req, res) => {
  const locations = funciones.getLocations();
  res.json(locations);
});

router.post("/eliminar", function(req, res) {
  let { id } = req.body;

  if (!id) {
      return res.status(400).json({ success: false, message: "❌ ID requerido" });
  }

  id = Number(id);

  try {
      const locations = funciones.getLocations();
      const index = locations.findIndex(loc => loc.id === id);

      if (index === -1) {
          return res.status(404).json({ success: false});
      }

      funciones.removeLocation(id);
      return res.json({ success: true });
  } catch (error) {
      console.error("❌ Error eliminando el punto:", error);
      return res.status(500).json({ success: false });
  }
});

router.post("/add", function (req, res) {
  const newLocation = req.body;
  if (!newLocation.titulo || !newLocation.lat || !newLocation.lng) {
      return res.status(400).json({ success: false });
  }

  funciones.addLocation(newLocation);
  res.json({ success: true });
});

router.post("/edit", (req, res) => {
  const { id, ...updatedData } = req.body;

  if (!id) {
      return res.status(400).json({ success: false, error: "ID is required" });
  }

  const result = funciones.editLocation(Number(id), updatedData);

  if (result.success) {
      res.json({ success: true, message: "Location updated successfully", location: result.location });
  } else {
      res.status(404).json({ success: false, error: result.error });
  }
});


module.exports = router;
