import express from 'express'
import { createService, getAllService, getServiceById } from '../controllers/ServiceController.js';

const router = express.Router()

router.get("/getallservice", getAllService)
router.post("/getservicebyid", getServiceById)
router.put("/createservice", createService)

export default router;