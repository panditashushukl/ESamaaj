require('dotenv').config()
const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/ShuklaJI', (req, res) => {
  res.send("<h1>ShuklaJI</h1>")
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
