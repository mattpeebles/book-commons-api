const express = require('express')
const app = express()
const cors = require('cors');
const {PORT, CLIENT_ORIGIN} = require('./config');

app.use(
    cors({
        origin: CLIENT_ORIGIN
    })
);

app.get('/api/*', (req, res) => {
	res.json({ok: true})
})


app.listen(PORT, () => {
	console.log(`Your app is listening on port ${PORT}`)
})

module.exports = {app}