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



module.exports = router;
