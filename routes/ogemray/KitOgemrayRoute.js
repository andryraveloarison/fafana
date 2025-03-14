import express from 'express'
import {  addActionKit, createKitUser, deleteActionKit, getKitConsommationOnWeek, getAllActionKit, getHistoriqueByMois, getKitByDID, getKitByUser, getKitConsommationByPeriod, getKitConsommationByYear, getKitStatusQuery, KitOnorOff, updateActionKit,  updateKitInGroupe, updateTrancheKit } from '../../controllers/ogemray/KitUserController.js';
import { createKit, deleteUserKit_Kit_Historique_KitNotifStatus, getAllKitChine, getKitById, reinitialiserStatusNotifKit, updateNameKit } from '../controllers/ogemray/KitController.js';

const router = express.Router()


/**
 *
 *  APPAREIL IN OTHER SERVEUR
 *
 */
router.get("/getallkit", getAllKit)
router.post("/getkitbyid", getKitById)
router.put("/createkit", createKit)
router.post("/updatenamekit", updateNameKit)
router.post("/reintializestatusnotifkit", reinitialiserStatusNotifKit)
router.delete("/deletedatakit", deleteUserKit_Kit_Historique_KitNotifStatus)


/**
 *
 *  APPAREIL IN SERVEUR CHINE
 *
 */
router.get("/getallkitchine", getAllKitChine)



/**
 * KIT USER OGEMRAY
 */
router.post("/updatetranchekit", updateTrancheKit)
router.post("/getkitbyuser", getKitByUser)
router.post("/getkitbydid", getKitByDID)
router.post("/getkitstatusquery", getKitStatusQuery)
router.post("/kitonoroff", (req, res) => KitOnorOff(req, res))
router.post("/getkitconsommationbyperiod", getKitConsommationByPeriod)
router.post("/getkitconsommationbyyear", getKitConsommationByYear)
router.post("/getkitconsommationonweek", getKitConsommationOnWeek)
router.put("/createkituser", (req, res) => createKitUser(req, res))
router.post("/updatekitingroupe", updateKitInGroupe)
router.post("/gethistoriquebymois", getHistoriqueByMois)
router.post("/getallactionkit", getAllActionKit)
router.post("/addactionkit", addActionKit)
router.post("/updateactionkit", updateActionKit)
router.post("/deleteactionkit", deleteActionKit)


export default router;