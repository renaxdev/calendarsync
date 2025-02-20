const axios = require('axios');
const qs = require('qs');
require('dotenv').config();

const baseURL = process.env.BASE_URL;

/*
IServ-Verbindung entstanden durch Hilfe von https://github.com/dunklesToast
DANKE!
*/

class IServ {
    constructor(url) {
        this.url = baseURL;
        this.cookies = '';
        this.client = axios.create({
            baseURL,
            headers: {
                'accept': '*/*',
            },
            validateStatus: (e) => e === 302 || e === 200,
            maxRedirects: 0
        });
    }

    setCookies(newCookies) {
        if (!newCookies) return;
        if (!Array.isArray(newCookies)) newCookies = [newCookies];
        const combinedCookies = [...(this.cookies ? this.cookies.split('; ') : []), ...newCookies].filter(Boolean);
        this.cookies = combinedCookies.join('; ');
        this.client.defaults.headers.Cookie = this.cookies;
    }

    async login(username, password) {
        const data = qs.stringify({ _username: username, _password: password });
        const login = await this.client.post('/iserv/auth/login', data, {
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
        });

        if (login.headers['set-cookie']) {
            this.setCookies(login.headers['set-cookie']);
            await this.followRedirects();
            console.log('Login erfolgreich!');
            const unread = await this.client.get('/iserv/mail/api/unread/inbox', {
                headers: {
                    Cookie: this.cookies || this.client.defaults.headers.Cookie || ''
                }
            });
        } else {
            throw new Error('Login fehlgeschlagen');
        }
    }

    async followRedirects() {
        const oauthredir = await this.client.get('/iserv/');
        const location = oauthredir.headers.location;
        
        if (location) {
            const final = await this.client.get(location);
            this.setCookies(final.headers['set-cookie']);

            if (final.headers.location) {
                const r1 = await this.client.get(final.headers.location);
                this.setCookies(r1.headers['set-cookie']);
            }
        }
    }

    async logout() {
        this.client.defaults.headers.Cookie = '';
        this.setCookies('');
    }


    /*
    https://bbs2wob.de/iserv/calendar/feed/calendar-multi?start=2025-02-01&end=2025-03-01  --> start/end tag immer ändern!!! -- PRIVATE TERMINE
    https://bbs2wob.de/iserv/calendar/feed/plugin?plugin=holiday&start=2025-03-01T00%3A00%3A00%2B01%3A00&end=2025-05-01T00%3A00%3A00%2B02%3A00 -- FEIERTAGE
    https://bbs2wob.de/iserv/calendar/feed/plugin?plugin=exam-plan&start=2025-03-01T00%3A00%3A00%2B01%3A00&end=2025-04-01T00%3A00%3A00%2B02%3A00 -- KLAUSUREN
    */
    async getCalendarEntries(start, end, user){ //yyyy-mm-dd
        const holiday = await this.client.get(`/iserv/calendar/feed/plugin?plugin=holiday&start=${start}T00%3A00%3A00%2B01%3A00&end=${end}T00%3A00%3A00%2B02%3A00`, {headers:
            {
                Cookie: this.client.defaults.headers.Cookie,
            }
        });
        const exams = await this.client.get(`/iserv/calendar/feed/plugin?plugin=exam-plan&start=${start}T00%3A00%3A00%2B01%3A00&end=${end}T00%3A00%3A00%2B02%3A00`, {headers:
            {
                Cookie: this.client.defaults.headers.Cookie,
            }
        });
        const privateEvents = await this.client.get(`/iserv/calendar/feed/calendar-multi?start=${start}&end=${end}`, {headers:
            {
                Cookie: this.client.defaults.headers.Cookie,
            }
        });

        const allEvents = [
            ...holiday.data,
            ...exams.data,
            ...privateEvents.data[`\/${user}\/home`]
        ];
        
        return allEvents;
    }

}

module.exports = IServ;