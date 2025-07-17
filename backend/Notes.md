# Learning Backend

## Navigation

[Backend Basics](#backend-basics)

[Setting Project](#setting-project)

[About Express](#about-express)

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

### Setting Project

- The `start` script in the package.json file is used to run a particular file, typically to launch the application.

### About Express

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
