import { 
  changeCurrentPassword, getCurrentUser, getUserCurrentProfile, getWatchHistory, loggedOutUser, loginUser, refreshAccessToken, registerUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage 
} from "../controllers/user.controller.js"
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
router.route("/change-password").post(verifyJWT,changeCurrentPassword)
router.route("/current-user").get(verifyJWT,getCurrentUser)
router.route("/update-details").patch(verifyJWT,updateAccountDetails)

router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar)
router.route("/cover-image").patch(verifyJWT,upload.single("coverImage"), updateUserCoverImage)


router.route("/c/:username").get(verifyJWT,getUserCurrentProfile)
router.route("/history").get(verifyJWT,getWatchHistory)

export default router