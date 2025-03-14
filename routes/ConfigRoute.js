import express from 'express'
import { decodeTime, encodeTime, getTokenByKit, getTokenTongou } from '../controllers/ConfigController.js';

const router = express.Router()


/**
 * 
 * TONGOU SERVER
 */
router.get("/gettokentongou", getTokenTongou)


/**
 * 
 * OGEMRAY SERVER
 */
router.get("/gettokenbykit", getTokenByKit)
router.post("/decodetime", decodeTime)
router.post("/encodetime", encodeTime)

export default router;