'use strict'

const express = require('express');
const path = require('path');
const exphbs = require('express-handlebars');
const flash = require('connect-flash');
const session = require('express-session');

const mixedMiddleware = require('./middlewares/mixed');
const indexRoutes = require('./routes/index.routes');
const policesRoutes = require('./routes/polices.routes');

const app = express();
app.set('port', process.env.PORT || 4200);
app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', exphbs({
    defaultLayout: 'main',
    layoutsDir: path.join(app.get('views'), 'layouts'),
    partialsDir: path.join(app.get('views'), 'partials'),
    extname: '.hbs'
}));
app.set('view engine', '.hbs');
app.use(express.urlencoded({ extended: false }));
app.use(session({
    secret: 'eee',
    resave: true,
    saveUninitialized: true
}));
app.use(flash());
app.use(mixedMiddleware.setVariables);

// CORS
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader("Access-Control-Allow-Headers", "Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method, responseType");
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
    next();
});

app.use('/police', policesRoutes);
app.use('/', indexRoutes);
app.use(express.static(path.join(__dirname, 'public')));
app.use(mixedMiddleware.notFound);

module.exports = app;
