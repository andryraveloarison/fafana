import express from 'express'
import { createExpert, createExpertWithTypeExperts, getAllExpert, getExpertById, getExpertByZone, updateExpert } from '../controllers/Expert/ExpertController.js';
import { createExpertType, getAllExpertType } from '../controllers/Expert/ExpertTypeController.js';

const router = express.Router()

/**
 *  Expert Controller
 */
router.get("/getallexpert", getAllExpert)
router.post("/getexpertbyid", getExpertById)
router.post("/getexpertbyzone", getExpertByZone)
router.put("/createexpert", createExpert)
router.put("/createexpertwithtypeexpert", createExpertWithTypeExperts)
router.post("/updateexpert", updateExpert)



/**
 * Expert Type Controller
 */
router.get("/getallexpertype", getAllExpertType)
router.put("/createexperttype", createExpertType)

export default router;