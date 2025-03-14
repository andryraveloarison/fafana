import express from 'express'
import { createProvince, getAllProvince } from '../controllers/ProvinceController.js';

const router = express.Router()

router.get("/getallprovince", getAllProvince)
router.put("/createprovince", createProvince)

export default router;