
import { Router } from "express";
import { UserRegister, UserLogin , UserLoggedOut , GetProfile, getAllContacts } from "../controllers/user.controller.js";
import { verifyjwt } from "../middelware/auth.middelware.js";

const router = Router();




router.route("/register").post( UserRegister );
router.route("/login").post( UserLogin )
router.route("/loggedout").get( verifyjwt, UserLoggedOut)
router.route("/profile").get( verifyjwt, GetProfile)
router.route("/contacts").get( verifyjwt, getAllContacts )



export default router 