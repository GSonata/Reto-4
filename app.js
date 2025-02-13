var createError = require('http-errors');
var express = require('express');
var path = require('path');
const multer = require('multer');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');


var indexRouter = require('./routes/index');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css')));
app.use(express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js')));
app.use(express.static(path.join(__dirname, 'node_modules/leaflet/dist')));
app.use(express.static(path.join(__dirname, 'node_modules/sweetalert2/dist')));
app.use(express.static(path.join(__dirname, 'node_modules/jquery/dist')));
app.use(express.static(path.join(__dirname, 'node_modules/datatables.net/js')));
app.use(express.static(path.join(__dirname, 'node_modules/datatables.net/js')));
app.use(express.static(path.join(__dirname, 'node_modules/datatables.net-dt/css')));

app.use( session({
  secret:"78789689689790789689689798789",
  saveUninitialized: true,
  resave:true
}));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, 'public/images/'); 
  },
  filename: function (req, file, cb) {
      cb(null, file.originalname); 
  }
});

const upload = multer({ storage: storage });

app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
  }
  res.json({ imageUrl: `/images/${req.file.filename}` });
});


app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
