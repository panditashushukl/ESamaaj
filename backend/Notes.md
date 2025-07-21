# Learning Backend

## Navigation

[Backend Basics](#backend-basics)

[Setting Project](#setting-project)

[Express Basic](#express-basic)

[MiddleWares](#middlewares)

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

```JS
// Enable CORS (Cross-Origin Resource Sharing)
// Allows requests from the specified origin (useful for frontend-backend communication)
// 'credentials: true' allows cookies and authentication headers to be sent with requests
app.use(cors({
  origin: process.env.CORS_ORIGIN, 
  credentials: true
}));

// Parse incoming JSON requests with a payload size limit of 16kb
app.use(express.json({
  limit: "16kb"
}));

// Parse incoming URL-encoded requests (e.g., form submissions) with a size limit
app.use(express.urlencoded({
  extended: true, // Allows for rich objects and arrays to be encoded into the URL-encoded format
  limit: "16kb"
}));

// Serve static files from the "public" directory
// e.g., images, CSS files, client-side JavaScript
app.use(express.static("public"));

// Parse cookies attached to client requests
app.use(cookieParser()); 
```

### MiddleWares

1. In Express.js, middleware refers to functions that have access to:
    - The request object (req)
    - The response object (res)
    - The next middleware function in the application’s request-response cycle
  
2. Middleware functions can:
    - Execute any code
    - Modify the req and res objects
    - End the request-response cycle
    - Call the next middleware in the stack (next())

- Middlewares generally have syntax `app.use`.
- Middlewares have 4 parameters `(err,req,res,next)`

```JS
app.use((req, res, next) => {
  console.log('Request URL:', req.url);
  next(); // Pass control to the next middleware
});
```
