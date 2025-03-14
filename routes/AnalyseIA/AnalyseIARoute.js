import express from 'express'
import { createanalyseIA, getAllAnalyseIAByUser, getAnalyseIAById } from '../../controllers/AnalyseIA/AnalyseiaController.js';

const router = express.Router()


/**
 * ANALYSE IA
 */
router.post("/getallanalyseiabyuser", getAllAnalyseIAByUser)
router.post("/getanalyseiabyid", getAnalyseIAById)
router.post("/createanalyseia", createanalyseIA)



export default router;