
import { Router } from "express";

import { sendMessage, getMessages,deleteMessage } from "../controllers/message.controller.js";
import { verifyjwt } from "../middelware/auth.middelware.js";



const router = Router();


router.route("/:conversationId").post(verifyjwt, sendMessage);
router.route("/:conversationId").get(verifyjwt, getMessages);

router.route("/:conversationId/:messageId").delete(verifyjwt, deleteMessage);

export default router;












// import { Router } from "express";
// import { getAllContacts , getAllMessageByUser, getAllPartners, sendMessage } from "../controllers/message.controller.js";
// import { verifyjwt } from "../middelware/auth.middelware.js";

// const router = Router();





// router.route("/contacts").get( verifyjwt, getAllContacts );
// router.route("/chat").get( verifyjwt, getAllPartners );
// router.route("/:id").get( verifyjwt, getAllMessageByUser );
// router.route("/send/:id").post( verifyjwt, sendMessage );


// export default router



