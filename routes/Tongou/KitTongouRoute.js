import express from 'express'
import { addKitTongouInEcozipo, controlKit, getTotalUsageKitTongou, getAllKitEcozipoTongou, getDateFomatend, getAllKitTongou, getStatisticsKitTongou, getStatusKitTongou, updateKitTongouInEcozipo, blockedKit, testNotif } from '../../controllers/Tongou/KitTongouController.js';
import { addKitTongouUser, deleteKitTongouUser, getAllKitTongouUser, getKitTongouUserByIdKit, getStatisticsKitByDay, getStatisticsKitByMois, getStatisticsKitBy7LastDays, getStatisticsKitByYears, updateKitTongouUser, updateGroupeUserKitTongou, getAllKitTongouUserByGroupe, deleteGroupeUserKitTongou, getAllKitTongouUserEcoZipo, updateCompteElectriciteEauKitUser, getAllKitTongouByCompteElectriciteId, getAllKitTongouUserNew, getAllKitPrincipaleUser, enleverKitTongouInGroupe, getAllKitTongouUserByOtherGroupe, updateValueKitHybrideByPrincipale, getStatisticsKitByMoisSpecifique } from '../../controllers/Tongou/KitTongouUserController.js';
import { desactiverConsommationPersonnalisseInKitValeurBut, getKitValeurByIdKitTongou, updateConsommationMinInKitValeurBut, updateKitValeurByIdKitTongou, updateModeGestionKit } from '../../controllers/Tongou/KitValeurButController.js';
import { createModeGestion, getAllModeGestion, getModeGestionById, updateModeGestionNull } from '../../controllers/Tongou/ModeGestionController.js';
import { getAddDateReleveFactureMois, updateDateReleveCompte, updateFactureMoisCompte } from '../../controllers/Tongou/KitTongouElectriciteCompte.js';
import { createKitTongouGroupe, getAllKitTongouGroupe, getKitTongouGroupeByUser, updateGroupeInKit, updateNameKitTongouGroupe } from '../../controllers/Tongou/KitTongouGroupeController.js';
import { AnalyseKwh7LastDaysIA  } from '../../controllers/Tongou/KitTongouIAController.js';
import { AddScheduledTask, deleteScheduledTask, getScheduledTask } from '../../controllers/Tongou/KitTongouTaskController.js';
import { addKitTypeTongou, getAllKitTypeTongou, getKitTypeTongouById, updateKitTypeTongou } from '../../controllers/Tongou/KitTypeTongouController.js';
import { getAssetsInformation } from '../../controllers/ConfigController.js';
import { addAutoReleveKitTongou, getAllAutoReleveByKitPrincipale, updateAutoReleveKitTongou } from '../../controllers/Tongou/KitTongouAutoReleveController.js';
import { deleteUserUseMyKit, getAllUserNeedValidationToConnectedByKitTongou, getAllUserUsedMyKitTongou, linkUserToOtherKitTongou, validDemandeUserKit } from '../../controllers/Tongou/KitTongouManyUser.js';
import { createCommunauteAvis, getAllUserForCommunaute, getCommunauteAvisByUser, updateCommunauteAvis } from '../../controllers/Tongou/KitCommunauteController.js';
import { detectSurconsommationWeek, getAllStatisticsKitTongouForIA, sendNotificationSurconsommationWeek, sendStatisticKitDays, sendStatisticKitHours, sendStatisticKitWeek } from '../../controllers/Tongou/KitTongouModelAController.js';
import { getSimulationById, makeSimulationKit, sendNotificationSimulation } from '../../controllers/Tongou/SimulationController.js';
// import { getDetail } from '../../controllers/Tuya/TyuaController.js';


const router = express.Router()

// server tongou
router.get("/getallkittongou", getAllKitTongou)
router.get("/getassetsinformation", getAssetsInformation)


/**
 *  Kit Tongou Controller
 */
router.get("/getallkitecozipotongou", getAllKitEcozipoTongou)
router.post("/getstatuskittongou", getStatusKitTongou)
router.post("/addkittongouinecozipo", addKitTongouInEcozipo)
router.post("/updatekittongouinecozipo", updateKitTongouInEcozipo)
router.post("/getstatisticskittongou", getStatisticsKitTongou)
router.post("/controlkittongou", (req, res) => controlKit(req, res))
router.post("/formateddate", getDateFomatend)
router.post("/blockedkit", blockedKit)
router.post("/gettotalusagekittongou", getTotalUsageKitTongou)
router.post("/testNotif",(req, res) => testNotif(req, res))


/**
 * Kit Tongou User Controller
 */
router.get("/getallkittongouuserecozipo", getAllKitTongouUserEcoZipo)
router.post("/getallkittongouuser", (req, res) => getAllKitTongouUser(req, res))
router.post("/getallkitprincipaleuser", (req, res) => getAllKitPrincipaleUser(req, res))
router.post("/getallkittongouusernew", (req, res) => getAllKitTongouUserNew(req, res))
router.post("/getallkittongouuserbycompteelectricite", (req, res) => getAllKitTongouByCompteElectriciteId(req, res))
router.post("/getallkittongouuserbygroupe", (req, res) => getAllKitTongouUserByGroupe(req, res))
router.post("/getallkittongouuserbyothergroupe", (req, res) => getAllKitTongouUserByOtherGroupe(req, res))
router.post("/getkittongouuserbyidkit", (req, res) => getKitTongouUserByIdKit(req, res))
router.post("/addkittongouuser", addKitTongouUser)
router.post("/getstatisticskitbyyears", getStatisticsKitByYears)
router.post("/getstatisticskitbymois", getStatisticsKitByMois)
router.post("/getstatisticskitbymoisspecifique", getStatisticsKitByMoisSpecifique)
router.post("/getstatisticskitby7lastdays", getStatisticsKitBy7LastDays)
router.post("/getstatisticskitbyday", getStatisticsKitByDay)
router.delete("/deletekittongouuser", deleteKitTongouUser)
router.post("/updatekittongouuser", updateKitTongouUser)
router.post("/updatecompteelectriciteeaukituser", updateCompteElectriciteEauKitUser)
router.post("/updatevaluekithybridebyprincipale", updateValueKitHybrideByPrincipale)


/**
 * Kit Groupe Tongou  Controller
 */
router.get("/getallkitgroupetongou", getAllKitTongouGroupe)
router.post("/gettongougroupebyuser", getKitTongouGroupeByUser)
router.post("/createkitgroupetongou", createKitTongouGroupe)
router.post("/updategroupetongouinkit", updateGroupeInKit)
router.post("/updatenamekittongougroupe", updateNameKitTongouGroupe)



router.post("/updategroupeuserkittongou", updateGroupeUserKitTongou)
router.post("/enleverkittongouingroupe", enleverKitTongouInGroupe)
router.post("/deletegroupeuserkittongou", deleteGroupeUserKitTongou)



/**
 * Kit Communaute
 */
router.get("/getalluserforcommunaute", getAllUserForCommunaute)
router.post("/getcommunauteavisbyuser", getCommunauteAvisByUser)
router.post("/createcommunauteavis", createCommunauteAvis)
router.post("/updatecommunauteavis", updateCommunauteAvis)  





/**
 *  Kit Tongou Model IA
 */
router.post("/sendstatistickithours", sendStatisticKitHours)
router.post("/sendstatistickitdays", sendStatisticKitDays)
router.post("/sendstatistickitweek", sendStatisticKitWeek)
router.post("/getallstatisticskittongouforia", getAllStatisticsKitTongouForIA)
router.post("/detectsurconsommationweek", detectSurconsommationWeek)
router.post("/sendnotificationsurconsommationweek", sendNotificationSurconsommationWeek)
router.post("/sendNotificationSimulation", sendNotificationSimulation)



/**
 * KIT TONGOU & COMPTE ELECTRICITE EAU
 */
router.post("/getaddaterelevefacturemois", getAddDateReleveFactureMois)
router.post("/updatefacturemoiscompte", updateFactureMoisCompte)
router.post("/updatedaterelevecompte", updateDateReleveCompte)




/**
 *SIMULATION IA KIT
 */
router.post("/makesimulationkit", makeSimulationKit)
router.post("/getsimulation", getSimulationById)



/**
 * Kit Valeur But Controller
 */
router.post("/desactiverkwhkitvaleurbut", desactiverConsommationPersonnalisseInKitValeurBut)
router.post("/updateconsommationmininkitvaleurbut", updateConsommationMinInKitValeurBut)
router.post("/updatemodegestionkit", updateModeGestionKit)
router.post("/getkitvaleurbyidkittongou", getKitValeurByIdKitTongou)
router.post("/updatekitvaleurbut", updateKitValeurByIdKitTongou)


/**
 * Mode Gestion
 */
router.get("/getallmodegestion", getAllModeGestion)
router.post("/getmodegestionbyid", getModeGestionById)
router.post("/updatemodegestionnull", updateModeGestionNull)
router.post("/createmodegestion", createModeGestion)



/**
 * IA
 */
router.post("/analysekwh7lastdays", AnalyseKwh7LastDaysIA)




/**
 * SCHEDULE TASK
 */
router.post("/addscheduledtask", AddScheduledTask)
router.post("/getscheduledtask", getScheduledTask)
router.delete("/deletescheduledtask", deleteScheduledTask)




/**
 * KIT TYPE TONGOU
 */
router.get("/getallkittypetongou", getAllKitTypeTongou)
router.post("/getkittypetongoubyid", getKitTypeTongouById)
router.post("/addkittypetongou", addKitTypeTongou)
router.post("/updatekittypetongou", updateKitTypeTongou)



/**
 * KIT TONGOU AUTORELEVE
 */
router.post("/getallautorelevebykitprincipale", getAllAutoReleveByKitPrincipale)
router.post("/addautorelevekittongou", addAutoReleveKitTongou)
router.post("/updateautorelevekittongou", updateAutoReleveKitTongou)



/**
 * KIT TONGOU RELIER MANY USER
 */
router.post("/linkusertokittongou",(req, res) => linkUserToOtherKitTongou(req, res))
router.post("/getalluserneedvalidationtoconnectedbykittongou", getAllUserNeedValidationToConnectedByKitTongou)
router.post("/getalluserusedmykittongou", getAllUserUsedMyKitTongou)
router.post("/validdemandeuserkit", validDemandeUserKit)
router.delete("/deleteuserusemykit", deleteUserUseMyKit)



export default router;