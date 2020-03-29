const db = require('./database/db').initDbConnection()
const keyPair = require('./lib/utils').getKeyPair('pub.key', 'priv.key')
const express = require('express')
const app = express()

exports.db = db
exports.keyPair = keyPair

const cors = require('cors')
const fs = require('fs')
const https = require('https')
const bodyParser = require('body-parser')
const upload = require('express-fileupload')


//Add middleware that parses body that is 'application/json' to JSON and catch it's errors
app.use((req, res, next) => {
    bodyParser.json()(req, res, err => {
        if (err) return res.status(400).send('JSON is not well formed');
        next();
    });
});

//Add cors middleware
app.use(cors())

//Add express-fileupload middleware to take care of 'multipart-file' requests
app.use(upload())

//CONTROLLERS
app.get('/', (req, res) => {
    res.sendfile(__dirname + '/html/index.html')
})

const users = require('./controllers/users')
app.use('/api/users', users)

const login = require('./controllers/login')
app.use('/api/login', login)

const posts = require('./controllers/posts')
app.use('/api/posts', posts)

//No route found
app.use(function (req, res) {
    res.sendFile(__dirname + '/html/error.html');
});

//Start HTTPS Server
const server = https.createServer({
    cert: fs.readFileSync('cert.pem'),
    key: fs.readFileSync('key.pem'),
    passphrase: '5440123718'
}, app)

server.listen('443', () => {
    console.log('Server started');
});