const ics = require('ics');
const fs = require('fs');
const path = require('path');

//TODO: Längere Termine werden nur für einen Tag angezeigt -- FIXEN

function generateICS(uuid, events) {
    if (!fs.existsSync(path.join(__dirname, 'icsFiles'))) {
        fs.mkdirSync(path.join(__dirname, 'icsFiles'), { recursive: true });
        console.log('Ordner "icsFiles" wurde erstellt.');
    }

    const icsEvents = events.map(termin => {
        const event = {
            start: new Date(termin.start).toISOString().split('T'),
            end: new Date(termin.end).toISOString().split('T'),
            title: termin.title,
            description: termin.when,
            allDay: termin.allDay,
        };

        return {
            title: event.title,
            start: event.start[0].split('-').map(num => parseInt(num)),
            duration: { 
                hours: new Date(termin.end).getHours() - new Date(termin.start).getHours(),
                minutes: new Date(termin.end).getMinutes() - new Date(termin.start).getMinutes()
            },
            description: event.description,
        };
    });

    ics.createEvents(icsEvents, (error, value) => {
        if (error) {
            console.log('Fehler beim Erstellen der ICS-Datei:', error);
            return;
        }

        const filePath = path.join(__dirname, 'icsFiles', `${uuid}.ics`);
        fs.writeFileSync(filePath, value);
        console.log(`ICS-Datei gespeichert: ${filePath}`);
    });
}


module.exports = generateICS;