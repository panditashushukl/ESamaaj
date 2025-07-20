# Learning Backend

## Navigation

[Backend Basics](#backend-basics)

[Setting Project](#setting-project)

[Express Basic](#express-basic)

---

### Backend Basics

- Server is a software that is serving.
- Database is always in another Continent.
- **src** : have index (connects DB), App(config, Cookie, URL Encode), constants (enums, DB-name).
- **DB** : folder contain the code of Database.
- **Model** : Doing CRUD operation and defining data structure.
- **Controllers** : Request logic, communicate between routes and models, functions.
- **Router** : The Router maps HTTP requests to the controller functions.
- **Middlewares** : Handle request/response processing before the controller
- **Utils** (Utilities) : Reusable helper functions, not tied to request/response cycle.
- Express is used to listen on the backend.
- **Express** is a web Framework for node js.
- Common js use `require` [Old Practice] where as module js use `import` [New Practice].
- `.env` Keeps sensitive data out of your code, Easy to change configuration without touching code
- CORS defines a way for the browser and the server to safely interact when they are on different origins (domain, port, or protocol).
- A **proxy** acts as an intermediary between the client (frontend) and the server (backend). It forwards requests from one domain or port to another — especially useful in development environments to handle **CORS** and keep things clean.
- To avoid **CORS** issue either use **Proxy** or do **Whitelisting** in the server (backend).
- First of all think of what screens we have to display and what feilds we need to store in DataBase.
- First think of Register and what feilds you want to enter.
- Always wrap Code of Mongodb connection code in the try-catch.
- Database is always in another continent so to communicate with DB takes time, always wrap the code in async - await.
- Professionally always start iffe with semicolon.

### Setting Project

- The `start` script in the package.json file is used to run a particular file, typically to launch the application.

### Express Basic

```JS
const express = require('express')
const app = express()
const port = 3000

/*
app.get('/route', 
Call Back Function That mainly has request and response
)

app.listen(port, call back function)
*/

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
```
