const express = require('express')
const session = require('express-session')
const mongoose = require('mongoose')
const passport = require('passport')
const { Strategy: LocalStrategy } = require('passport-local')
const flash = require('connect-flash')
const dotenv = require('dotenv')
const parseArgs = require('minimist')
const { fork } = require('child_process')


let visitas = 0

dotenv.config()

/* const args = yargs(process.argv.slice(2))
  .alias({
    puerto: 'p'
  })
  .default({
    puerto: 8080
  })
  .argv */

const options = {
  default: {
    port: 8080
  }
}
options.alias = {
  p: 'port'
} 

const args = parseArgs(process.argv.slice(2), options) 

mongoose.connect(`mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/desafioSesion`)
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

app.get('/info', (req, res) =>{
  return res.render('info',{
    arg: `Argumentos de entrada: ${JSON.stringify(args,null,2)}`,
    path: `Path de ejecucion: ${process.execPath}`,
    so: `Nombre de la plataforma: ${process.platform}`,
    pid: `Process ID: ${process.pid}`,
    version: `Version de Node: ${process.version}`,
    carpeta: `Carpeta del proyecto: ${process.cwd()}`,
    memoria: `Memoria total reservada: ${JSON.stringify(process.memoryUsage(), null, 2)}`
  })
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

app.get('/visitas', (req, res) =>{
  return res.end(`Visitas: ${visitas++}`)
})

app.get('/api/randoms', (req, res) =>{
  let cant = Number(req.query.cant)
 
  if(isNaN(cant)){
    cant = 100000
    
    process.send(cant)
    const numRandoms = fork('../random/random.js')
    numRandoms.on('mesagge', numeros =>{
      return res.end(`Me tiro estop: ${numeros}`)
    })
  } 
  else {
    process.send(cant)
    const numRandoms = fork('../random/random.js')
    numRandoms.on('mesagge', numeros =>{
      return res.end(`Me tiro estop: ${numeros}`)
    })
  } 
})   
  

  


PORT = args.port

app.listen(PORT, process.env.HOST, () => console.log(`Servidor corriendo en http://${process.env.HOST}:${PORT}`))

