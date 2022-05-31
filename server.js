//esto nos avisa si no estamos en produccion (in development)
//vamos a usar dotenv 
if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config();
}

const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');

//=========passport=======//
const initializePassport = require('./passport-config');

initializePassport(
    //todo estos parametros son los que le pasamos a passport-config.js
    //passport, getUserByEmail, getUserById

    passport, 
    (email) => {
    return users.find(user => user.email === email)
    },
    (id) => {
        return users.find(user => user.id === id)
    }
    )

//=========base de datos en memorias=========//
//esto es algo que no vas a hacer en produccion, pero si como algo local.
//por ahora estamos guardando todo en memoria
//lo idea es que esto se guarde en una base de datos
const users = []

//====seteamos el view engine====//
//avisar que voy a usar ejs 
app.set('view engine', 'ejs');

//esto lo que hace es decirle a nuestra app que todo lo que 
//venga x formulario lo lea en los "req" y lo pueda usar en post methods.
app.use(express.urlencoded({extended: false}));

app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false, //esto nos dice que no re guardemos la sesion.
    saveUninitialized: false //esto es para que no se guarde un objeto vacio en la sesion
}))

app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))

//===========================================================//

app.get("/", checkAuthenticated,  (req,res) =>{
    res.render("index.ejs", {
        name: req.user.name
    })
})

app.get("/login", checkNotAutheticated, (req,res) =>{
    res.render("login.ejs")
})

app.get("/register", checkNotAutheticated,  (req,res) =>{
    res.render("register.ejs")    
})

//usamos passport para autenticar.
app.post("/login",checkNotAutheticated,  passport.authenticate('local', {
    successRedirect: '/', //esto nos avisa a donde vamos cuando da ok.
    failureRedirect: '/login', //si es un fail volvemos a login
    failureFlash: true // esto nos avisa x flash el error.
}))

app.post("/register", checkNotAutheticated, async (req,res) =>{
    try {
        //usamos bcrypt para encriptar la contraseña
        const hashPassword = await bcrypt.hash(req.body.password, 10)
        users.push({
            id: Date.now().toString(),
            name: req.body.name,
            email: req.body.email,
            password: hashPassword
        })
        res.redirect("/login")
    }
    catch{
        res.redirect("/register")
    }
    console.log(users)
})

//para salir de la pagina.
app.delete('/logout', function(req, res, next) {
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/login');
    });
  });


//     req.logOut() //esto es algo que nos setea passport para limpiar la sesion.
//     res.redirect("/login") //y al hacer logout nos dirige a login.
// })

//pero para llamar a ese metodo delete, no podemos hacerlo a traves del browser,
//sino que lo hacemos a traves de un post method. (libreria)
//en vez de usar post, podemos usar delete.


//========middleware========//
//1)
//check authenticated middleware
//esto es para que me redirija a login si no estoy autenticado
function checkAuthenticated (req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect('/login')
}

//2)
//esto lo que hace es que no nos envie a login si ya estamos autenticados.
function checkNotAutheticated (req, res, next) {
    if (!req.isAuthenticated()) {
        return next()
    }
    res.redirect('/')
}

app.listen(3000)