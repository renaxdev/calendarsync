/*
Dieses Script entstand durch https://github.com/dunklesToast
DANKE!
*/

const axios = require('axios');
const qs = require('qs');
require('dotenv').config();

const baseURL = process.env.BASE_URL;
const username = process.env.ISERV_USER;
const password = process.env.ISERV_PASS;


const client = axios.create({
    baseURL,
    headers: {
        'accept': '*/*',
    },
    validateStatus: (e) => e === 302 || e === 200,
    maxRedirects: 0
});

(async () => {
    const data = qs.stringify({
        _username: username,
        _password: password
    })

    const login = await client.post('/iserv/auth/login', data, {
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
        },
    })

    if(login.data.includes('/iserv/auth/home')) {
        client.defaults.headers.Cookie = login.headers['set-cookie'].join(';')
        const oauthredir = await client.get('/iserv/', {
            baseURL,
        });

        const location = oauthredir.headers.location;

        const final = await client.get(location);
        const finalCookies = final.headers["set-cookie"]
        client.defaults.headers.Cookie = [...login.headers['set-cookie'], ...finalCookies].join(';');

        const r1 = await client.get(final.headers.location);
        client.defaults.headers.Cookie = [...login.headers['set-cookie'], ...finalCookies, ...r1.headers['set-cookie']].join(';');
        console.log('Login successful');

        const unread = await client.get('/iserv/mail/api/unread/inbox');
        console.log('Du hast ' + unread.data.count + ' ungelesene Nachrichten');
    } else {
        throw new Error('Login failed');
    }
})();