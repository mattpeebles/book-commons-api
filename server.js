const express = require('express')
const app = express()


const PORT = process.env.port || 8080

app.get('/api/*', (req, res) => {
	res.json({ok: true})
})


app.listen(port=PORT, () => {
	console.log(`Your app is listening on port ${port}`)
})

module.exports = {app}