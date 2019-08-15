require('custom-env').env();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
// var logger = require('morgan');
var cors = require('cors');
var session = require('express-session');
const LokiStore  = require('connect-loki')(session);
var uuid = require('uuid');

const passport = require('./passport/passport'); // todo: import passport from passport and change this to passportSetup

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/user');
var trainingRouter = require('./routes/training');
const trainingHistRouter = require('./routes/training-history');
var exerciseRouter = require('./routes/exercise');
var bodyPartRouter = require('./routes/bodyPart');
const authRouter = require('./routes/auth/auth');

const authMiddleware = require('./routes/auth/authMiddleware');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(cors({
  origin: eval(process.env.CORS_ULRS),
  credentials: true
}));
// app.use(logger('dev'));

app.use(session({
    genid: (req) => {
        console.log('Inside the session middleware. req.sessionID: ', req.sessionID);
        return uuid();
    },
    // store: new FileStore(), // u can use db instead of file.
    store: new LokiStore({
      path: './sessions/session-store.db',
      logErrors: (process.env.NODE_ENV && (process.env.NODE_ENV === 'development') ? true : false),
      ttl: 1209600 //ttl Duration in seconds to keep stale sessions. Set to 0 to disable TTL. Defaults to 1209600 (14 days)
    }), // u can use db instead of file.
    secret: 'secret keyboard', // change for randomly generated in production.
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: process.env.SESSION_EXPIRATION_AFTER * 60 * 60 * 1000
    }
}));

// add passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/user', authMiddleware.isLoggedIn, usersRouter);
app.use('/training', authMiddleware.isLoggedIn, trainingRouter);
app.use('/training-hist', authMiddleware.isLoggedIn, trainingHistRouter);
app.use('/exercise', authMiddleware.isLoggedIn, exerciseRouter);
app.use('/body-part', authMiddleware.isLoggedIn, bodyPartRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  const error = req.app.get('env') === 'development' ? err : {};
  // console.log(req.app.get('env'));

  console.log(err);
  
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = error;

  // render the error page
  res.status(err.status || res.statusCode || 500);
  res.json({
    message: err.message,
    error: error
  });
});

module.exports = app;
