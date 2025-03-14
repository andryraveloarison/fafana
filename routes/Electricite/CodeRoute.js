import express from 'express'
import { getAgenceByCommune, getAgenceByTourne, getAllAgence, getAllCompteElectriciteEauCible, getAgenceByTourneAndCommune, getAllFne, getFneByTarif, getAllPrix, getPrixByZoneAndTarif, getAllTaxe, getTaxeByTarifCommuneActivite, getAllTarif, getTarifById, getTarifByTarif } from '../../controllers/Electricite/CodeController.js';

const router = express.Router()


/***
 *  COMPTE ELECTRICITE EAU CIBLE CONTROLLER
 */
router.get("/getallcompteelectriciteeaucible", getAllCompteElectriciteEauCible)




/**
 * CODE AGENCE
 */
router.get("/getallagence", getAllAgence)
router.post("/getagencebytourne", getAgenceByTourne)
router.post("/getagencebycommune", getAgenceByCommune)
router.post("/getagencebytourneandcommune", getAgenceByTourneAndCommune)


/**
 * CODE FNE
 */
router.get("/getallfne", getAllFne)
router.post("/getfnebytarif", getFneByTarif)



/**
 * CODE PRIX
 */

router.get("/getallprix", getAllPrix)
router.post("/getcodeprixbyzoneandtarif", getPrixByZoneAndTarif)




/**
 * CODE TAXE
 */
router.get("/getalltaxe", getAllTaxe)
router.post("/gettaxebytarifcommuneactivite", getTaxeByTarifCommuneActivite)



/**
 * CODE TARIF
 */

router.get("/getallcodetarif", getAllTarif)
router.post("/getcodetarifbyid", getTarifById)
router.post("/getcodetarifbytarif", getTarifByTarif)
// router.put("/createcodetarif", createCodeTarif)
// router.post("/updatecodetarif", updateCodeTarif)




export default router;