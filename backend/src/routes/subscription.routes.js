import { Router } from 'express';
import {
    getChannelSubscribers,
    getUserSubscriptions,
    toggleSubscription,
} from "../controllers/subscription.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

// Routes related to a channel
router
  .route("/channels/:channelUsername/subscribers")
  .get(getChannelSubscribers)            // GET subscribers of a channel
  .post(toggleSubscription);             

// Routes related to a user
router
  .route("/users/:username/subscriptions")
  .get(getUserSubscriptions);  // GET channels the user is subscribed to


export default router