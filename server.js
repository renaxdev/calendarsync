const express = require('express');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const sqlite3 = require('sqlite3');

const db = new sqlite3.Database('./database/db.sqlite')

const app = express();
const port = process.env.PORT || 8080;

app.use(express.static('public'))


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/pages/index.html'));
});

app.get('/anmelden', (req, res) => {
    res.sendFile(path.join(__dirname, '/pages/anmelden.html'));
});

app.post('/usercreation', (req, res)=>{
    var uuid = uuidv4();
    db.run(`INSERT INTO user (uuid, mail, pass_hash) VALUES (?,?,?)`, [uuid, mail, password_hash], (err)=>{
        if(err){
            return console.error(err.message);
            res.send(`Speicherung der Daten nicht möglich. Fehler: ${err.message}`)
        }
        console.log("Daten gespeichert")

    })
    res.send(uuid) 
});

app.listen(port);
console.log('Server started at http://localhost:' + port);