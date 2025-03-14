import express from 'express'
import { Economiser } from '../../controllers/Electricite/EconomiserController.js';
import { createCompteElectricite, deleteCompteElectricite, getAllCompteElectricite, getCompteElectriciteById, getCompteElectriciteByUser, getCompteElectriciteByUserAndKit, updateCompteElectricite } from '../../controllers/Electricite/CompteElectriciteEauController.js';
import { CalculTKwhEnAriaryTTCBody } from '../../controllers/JiramaCalculController.js';
import { deleteUserUseMyCompte, getAllUserNeedValidationToConnectedByCompteUser, linkUserToAccounts, validDemandeUserCompte } from '../../controllers/Electricite/UserManyCompteurController.js';
import { deleteAllAgence, deleteCompteElectriciteEauCible, importerAgenceExcel, importerCompteElectriciteEauCible } from '../../controllers/Electricite/ImporterExcelController.js';
import { addAutoReleveByCompte, getAllAutoReleveByCompteur, getDernierValeurAutoReleve, updateAutoReleveCompteElectriciteEau, updateConsommationInitialeByKit } from '../../controllers/Electricite/AutoReleveController.js';

const router = express.Router()


/***
 *  COMPTE ELECTRICITE EAU CONTROLLER
 */
router.get("/getallcompteelectricite", getAllCompteElectricite)
router.post("/getcompteelectricitebyid", getCompteElectriciteById)
router.post("/getcompteelectricitebyuser", getCompteElectriciteByUser)
router.post("/getcompteelectricitebyuserandkit", getCompteElectriciteByUserAndKit)
router.post("/createcompteelectriciteeau", createCompteElectricite),
router.post("/updatecompteelectriciteeau", updateCompteElectricite)
router.delete("/deletecompteelectriciteeau", deleteCompteElectricite)



/**
 * Link Account
 */
router.post("/linkaccount",(req, res) => linkUserToAccounts(req, res))
router.post("/getalluserneedvalidationtoconnectedbycompteuser", getAllUserNeedValidationToConnectedByCompteUser)
router.post("/validdemandeusercompte", validDemandeUserCompte)
router.delete("/deleteuserusemycompte", deleteUserUseMyCompte)


/***
 *  ECONOMISER CONTROLLER
 */
router.post("/economiser", Economiser)


/**
 *  CALCULE KWH EN ARIARY
 */
router.post("/calculkwhenariary", CalculTKwhEnAriaryTTCBody)



/**
 * EXPORT EXCEL
 */
router.post("/importeragenceExcel", importerAgenceExcel)
router.delete("/deleteallagence", deleteAllAgence)
router.post("/importercompteelectriciteeaucible", importerCompteElectriciteEauCible)
router.delete("/deletecompteelectriciteeaucible", deleteCompteElectriciteEauCible)




/**
 *  AUTO RELEVE
 */
router.post("/getallautorelevebycompteur",(req, res) => getAllAutoReleveByCompteur(req, res))
router.post("/getderniervalueautoreleve",(req, res) => getDernierValeurAutoReleve(req, res))
router.post("/addautorelevebycompte",(req, res) => addAutoReleveByCompte(req, res))
router.post("/updateautoreleve",(req, res) => updateAutoReleveCompteElectriciteEau(req, res))






/**
 *  AUTO RELEVE
 */
router.post("/updateconsommationintialisebykit",(req, res) => updateConsommationInitialeByKit(req, res))



export default router;