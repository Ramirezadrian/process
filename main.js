const express = require('express')
const session = require('express-session')
const mongoose = require('mongoose')
const passport = require('passport')
const { Strategy: LocalStrategy } = require('passport-local')
const flash = require('connect-flash')

mongoose.connect('mongodb://localhost:27017/desafioSesion')
const User = require('./models/user')

const { createHash, isValidPassword } = require('./utils')

const app = express()
app.use(express.static('./public'))
app.set('view engine', 'ejs')

app.use(flash())

app.use(session({
  secret: 'qwerty',
  resave: true,
  saveUninitialized: true,
  cookie: {
    maxAge: 100000,
  }
}))

app.use(passport.initialize())
app.use(passport.session())

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

passport.use('login', new LocalStrategy((username, password, done) => {
  return User.findOne({username})
  .then(user => {
    if(!user) {
      return done(null, false, {message: 'Nombre de usuario incorrecto'})
    }

    if(!isValidPassword(user.password, password)){
      return done(null, false, {message: 'Contraseña incorrecta'})

    }
    return done(null, user)
  })
  .catch(err=> done(err))
}))

passport.use('signup', new LocalStrategy({
  passReqToCallback: true
},(req, username, password, done) => {
  return User.findOne({username})
  .then(user => {
    if(user) {
      return done(null, false, {message: 'El nombre de usuario ya existe'})
    }

    const newUser = new User()
    newUser.username = username
    newUser.password = createHash(password)
    newUser.email =req.body.email

    return newUser.save()

  })
  .then(user => done(null, user))
  .catch(err=> done(err))
}))

passport.serializeUser((user, done) => {
  console.log('serializeUser')
  done(null, user._id)

})

passport.deserializeUser((id, done) => {
  console.log('deserializeUser')
  User.findById(id,(err,user) => {
    done(err, user)
  })
})

 app.get('/login', (req, res) => {
    return res.render('login', {message: req.flash('error')}) //EJS
   
}) 

app.get('/signup', (req, res) => {
  return res.render('signup', {message: req.flash('error')}) //EJS
 
}) 

app.post('/login', passport.authenticate('login', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}))


app.post('/signup', passport.authenticate('signup', {
  successRedirect: '/',
  failureRedirect: '/signup',
  failureFlash: true
}))


/* const sessionOn = function(req, res, next) {
  if (!req.session.user)
    return res.redirect('/logout')
  else
    return next()
}  
app.get('/', sessionOn, (req, res) => {

  return res.render('home',{name:req.session.user}) //EJS
}) 
*/
app.get('/', (req,res,next) => {
  if(req.isAuthenticated()){
    return next()
  }
  return res.redirect('login')

}, (req, res) => {
  return res.render('home',{
    name:req.user.username,
    email:req.user.email
  }) //EJS
})
app.get('/logout', (req, res) => {
    const name = req.session.user
    return req.session.destroy(err => {
        if (!err) {
        return res.render('logout', {name:req.user.username}) //EJS
        }

        return res.render({ error: err })
    })
})

const PORT = 8080

app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`))