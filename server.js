const express = require('express');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const sqlite3 = require('sqlite3');
var bodyParser = require('body-parser')
var nodemailer = require('nodemailer'); 
require('dotenv').config();
var bcrypt = require('bcryptjs');
const generateICS = require('./ics/generateICS');

const IServ = require('./iserv');

const d = new Date();


const transporter = nodemailer.createTransport({
    host: 'smtp.strato.de',
    port: 587,
    secure: false,
    auth: {
        user: 'info@notenradar.de',
        pass: process.env.SMTP_SECRET
    }
});

const iserv = new IServ(process.env.BASE_URL);

function sendMail(uuid, email){
    var mailOptions = {
        from: 'info@notenradar.de',
        to: email,
        subject: 'CalendarSync: Dein Kalenderabonnement-Link',
        text: 'Hi, willkommen bei CalendarSync! \n\nUm deinen Kalender mit CalendarSync zu synchronisieren, füge folgenden Link in deinem Kalendarprogramm hinzu: \n\nhttps://calendarsync.notenradar.de/calendar/' + uuid + '.ics \n\nViel Spaß mit CalendarSync!'
      };
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
    
}

const db = new sqlite3.Database('./database/db.sqlite')

const app = express();
const port = process.env.PORT || 8080;

app.use(express.static('public'))
app.use(express.static('/ics/icsFiles/'))
app.use(express.json())
app.use(bodyParser.urlencoded({ extended: true }));


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/pages/index.html'));
});

app.get('/anmelden', (req, res) => {
    res.sendFile(path.join(__dirname, '/pages/anmelden.html'));
});

app.post('/usercreation', async (req, res)=>{
    var email = req.body.email;
    var password = req.body.password;
    var hashedPassword = await bcrypt.hash(password, 10);
    var uuid = uuidv4();
    db.run(`INSERT INTO user (uuid, email, pass_hash) VALUES (?,?,?)`, [uuid, email, hashedPassword], (err)=>{
        if(err){
            return console.error(err.message);
        }
        console.log("Daten gespeichert")
    })
    res.sendFile(path.join(__dirname, '/pages/angemeldet.html'));
    sendMail(uuid, email);
    await iserv.login(email.split('@')[0], password);
    const events = await iserv.getCalendarEntries(`${d.getFullYear()}-01-01`, `${d.getFullYear()}-12-31`, email.split('@')[0]);
    console.log(events);
    generateICS(uuid, events);

});

app.get('/calendar/:uuid', (req, res) => {
    var uuid = req.params.uuid;
    res.sendFile(path.join(__dirname, '/ics/icsFiles/' + uuid));
});

app.listen(port, '0.0.0.0');
console.log('Server started - PORT:' + port);