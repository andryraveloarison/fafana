import express from 'express'
import { addAppareil, getallAppareil } from '../../controllers/Compte/AppareilController.js'
import { addTypeHome, getallTypeHome } from '../../controllers/Compte/TypeHomeController.js'
import { addMessage, getMessages } from '../../controllers/Compte/discussionController.js'

const router = express.Router()

// appareil
router.get("/getallAppareil", getallAppareil)
router.post("/addAppareil", addAppareil)

// type home
router.get("/getallTypeHome", getallTypeHome)
router.post("/addTypeHome", addTypeHome)

// Message
router.post("/getMessages", getMessages)
router.post("/addMessage", addMessage)



export default router;