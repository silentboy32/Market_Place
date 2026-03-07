
import { Router } from "express";
import { getAllContacts , getAllMessageByUser, getAllPartners, sendMessage } from "../controllers/message.controller.js";
import { verifyjwt } from "../middelware/auth.middelware.js";

const router = Router();





router.route("/contacts").get( verifyjwt, getAllContacts );
router.route("/chat").get( verifyjwt, getAllPartners );
router.route("/:id").get( verifyjwt, getAllMessageByUser );
router.route("/send/:id").post( verifyjwt, sendMessage );


export default router



