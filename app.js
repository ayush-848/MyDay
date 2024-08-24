// app.js

require('dotenv').config();
const express = require('express');
const expressLayout = require('express-ejs-layouts');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const mongoStore = require('connect-mongo');
const session = require('express-session');
const flash = require('connect-flash');
const connectDB = require('./server/config/db');
const { isActiveRoute } = require('./server/helpers/routeHelpers');


const app = express();
const PORT = process.env.PORT || 5000;

connectDB();



app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(methodOverride('_method'));


app.use(session({
    secret: 'SPS',
    resave: false,
    saveUninitialized: true,
    store: mongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
    }),
    cookie: { secure: true }
    // cookie: { maxAge: 3600000 }
}));

app.use(flash());
app.use((req, res, next) => {
    res.locals.currentRoute = req.path;
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    next();
  });

app.use(express.static('public'));

app.use(expressLayout);
app.set('layout', './layouts/main');
app.set('view engine', 'ejs');


app.locals.isActiveRoute = isActiveRoute;

app.use('/', require('./server/routes/main'));
app.use('/', require('./server/routes/admin'));


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
