import express from 'express'
import { createKitGroupe, deleteAllTypeAppareil, deleteTypeAppareil, getAllKitGroupe, getKitGroupeByUser } from '../controllers/ogemray/KitGroupeController.js';

const router = express.Router()

router.get("/getallkitgroupe", getAllKitGroupe)
router.post("/getkitgroupebyuser", getKitGroupeByUser)
router.put("/createkitgroupe", createKitGroupe)
// router.post("/updatekitgroupe", updateKitGroupe)
router.delete("/deletetypeappareil", deleteTypeAppareil)
router.delete("/deletealltypeappareil", deleteAllTypeAppareil)

export default router;