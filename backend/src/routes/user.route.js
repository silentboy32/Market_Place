
import { Router } from "express";
import { UserRegister, UserLogin , UserLoggedOut } from "../controllers/user.controller.js";
import { verifyjwt } from "../middelware/auth.middelware.js";

const router = Router();




router.route("/register").post( UserRegister );
router.route("/login").post( UserLogin )
router.route("/loggedout").get( verifyjwt, UserLoggedOut)




export default router 