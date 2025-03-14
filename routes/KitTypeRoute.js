import express from 'express'
import { createKitType, getAllKitType, getKitTypeById } from '../controllers/KitTypeController.js';

const router = express.Router()

router.get("/getallkittype", getAllKitType)
router.post("/getkittypebyid", getKitTypeById)
router.put("/createkittype", createKitType)



export default router;