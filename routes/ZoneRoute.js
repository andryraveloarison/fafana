import express from 'express'
import { createZone, getAllZone, getZoneByProvince } from '../controllers/ZoneController.js';

const router = express.Router()

router.get("/getallzone", getAllZone)
router.post("/getzonebyprovince", getZoneByProvince)
router.put("/createzone", createZone)

export default router;