import { loggedOutUser, loginUser, registerUser } from "../controllers/user.controller.js"
import {upload} from "../middlewares/multer.middleware.js"

import { Router } from "express"

const router = Router()

router.route("/register").post(
  upload.fields([
    {
      name: "avtar",
      maxCount: 1
    },
    {
      name: "coverImage",
      maxCount: 1
    }
  ])
  ,registerUser
)

router.route("/login").post(loginUser)

//secured Route
router.route("/logout").post(verifyJWT, loggedOutUser)

export default router