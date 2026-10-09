
import { Router } from "express";

import { createConversation, getMyConversations } from "../controllers/conversation.controller.js";
import { verifyjwt } from "../middelware/auth.middelware.js";



const router = Router();

router.route("/").post( verifyjwt, createConversation);
router.route("/my-conversations").get(verifyjwt, getMyConversations);

export default router;