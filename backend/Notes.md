# Learning Backend

## Navigation

[Backend Basics](#backend-basics)

[Setting Project](#setting-project)

[Express Basic](#express-basic)

[MiddleWares](#middlewares)

[Models](#models)

[HTTP](#http)

[Contollers](#controllers)

[Steps to register User](#steps-to-register-user)

[Steps to Login User](#steps-to-login-user)

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
- The asyncHandler utility is a higher-order function that wraps async route handlers and catches any errors, so you don’t need to write try/catch in every single route.

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

- Multer is a middleware for Node.js that simplifies the handling of file uploads in web applications, particularly when using Express.js.

### Models

- MongoDB generates unique IDs for each data in BSON format, not JSON format.

  ```JS
    {
      "_id": ObjectId("60d21b4667d0d8992e610c85"),
      "name": "ShuklaJI"
    }
  ```

- In Mongoose, Model Names Are Singular, but Collections Are Pluralized
- If you want searching efficient make `index: true` in Models object.
- `Pre hooks` (also called middleware) are functions you can run before certain operations in Mongoose.
- They allow you to intercept and modify data or logic before something like a document is saved, validated, removed, or a query is run.

  ```JS
      schema.pre('<operation>', function (next) {
      // your logic
      next(); // move on to the actual operation
    });
  ```

- Mongoose instance methods (also called document methods) let you define custom functions on your schema that are available on individual documents.

    ```JS
      schema.methods.methodName = function () {
        // `this` refers to the document
      };
    ```

- `JWT` is a bearer token:
  - Anyone who presents (bears) the token is considered authenticated — as long as the token is valid (not expired and correctly signed).

### HTTP

- **HyperText Transfer Protocol (HTTP)** is a protocol that governs how clients and servers communicate over the web.
- HTTP headers are metadata that are key value pairs sent along with request and response.
- http headers do:
  - caching
  - authentication
  - manage state
- Request headers (from clients), Response Headers(from server), Representation headers(encoding/decoding), Payload headers (data).
- Most Common Headers:
  - Accept : application/json
  - User-Agent
  - Authorization
  - Content-type
  - Cookie
  - Cache-Control
- HTTP methods
  - GET : Retrieve a resource
  - HEAD : No message body (response headers only)
  - OPTIONS : What Operations are available.
  - TRACE : loopback test (get some data)
  - DELETE : remove a resource
  - PUT : replace a resource
  - POST : interact with resource (mostly add)
  - PATCH : chamge a part of resource
- HTTP Status Code:
  - 1** : Informational
  - 2** : Success
  - 3** : Redirection
  - 4** : Client Error
  - 5** : Server Error

### Controllers

```scss
React (Frontend)
   ↓
Express Routes (Backend API Endpoint)
   ↓
Controllers (Handle Logic)
   ↓
Models (MongoDB via Mongoose)
   ↓
MongoDB (Database)

```

- Responsibilities of a Controller
  - Handle incoming requests from the client
  - Call model functions to interact with the database
  - Process any business logic
  - Return a response (success, error, data, etc.)

### Steps to register User

  1. Get user details from frontend.
  2. Validation - not empty
  3. Check if user already exists : username and email.
  4. Check for images and Check for Avtar
  5. Upload on cloudinary
  6. Create user object - create entry in DB
  7. Remove password and refresh token feild from response.
  8. Check for user creation
  9. Return Response else return error

### Steps to Login User

  1. Take response from the frontend
  2. Check username or email exist in Database
  3. if username exist match the password
  4. if Password matches login the user else through error
  5. enerate access and refresh Token
  6. Send secure cookies
