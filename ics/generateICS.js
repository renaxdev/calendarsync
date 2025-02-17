const ics = require('ics');
const fs = require('fs');
const path = require('path');


function generateICS(uuid,  events){
    const event = {
        start: [2021, 3, 22, 6, 30],
        duration: { hours: 6, minutes: 30 },
        title: 'Testevent',
        description: 'This is a test event',
        location: 'Braunschweig',
        url: 'https://www.google.com'
    }
    ics.createEvent(event, (error, value) => {
        if (error) {
            console.log(error)
            return
        }
        fs.writeFileSync(path.join(__dirname, 'icsFiles', uuid + '.ics'), value)
    })
}

module.exports = generateICS;