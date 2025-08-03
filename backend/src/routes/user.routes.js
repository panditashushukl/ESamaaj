import { loggedOutUser, loginUser, refreshAccessToken, registerUser } from "../controllers/user.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
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
router.route("/refresh-token").post(refreshAccessToken)

export default router