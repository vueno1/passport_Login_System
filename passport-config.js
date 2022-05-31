//usamos esta version de local passport para que funcione en local
const localStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

function initialize(passport, getUserByEmail, getUserById) {

    //esta es la funcion que le pasaremos a passport.use
    const authenticateUser = async (email, password, done) => {
        const user = getUserByEmail(email)
        if(user == null) {
            return done(null, false, {message: 'The email is not registered'})
        }

        try {
            if(await bcrypt.compare(password, user.password)) {
                return done(null, user)
            } else {
                return done(null, false, {message: 'Password incorrect'})
            }
        }
        catch(e) {
            return done(e)
        }      
        
    }

    //usaremos esa local strategy
    passport.use(new localStrategy(
        //1) como lo llamaremos a nuestro User.
        {usernameField: 'email'}, 

        //2) Despues le pasamos una funcion de lo que va a hacer.
        authenticateUser))
        
        //serializa nuestro user y lo guarda en la sesion
        passport.serializeUser((user, done) => {done(null, user.id)})

        //y esto hace lo contrario para corroborar que el user esta en la sesion
        passport.deserializeUser((id, done) => {
            done(null, getUserById(id))
        })

}

module.exports = initialize;