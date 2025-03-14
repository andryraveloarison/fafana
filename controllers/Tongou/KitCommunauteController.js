import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv';
import axios from 'axios'
import axiosRetry from 'axios-retry'
import crypto from 'crypto';
import { getTokens } from '../../utils/tokenStore.js';
import { GenerateSign } from '../ConfigController.js';
import { comparaisonDate, functionGetStatisticsKitTongou, functionGetStatusKitTongou, functionSeeKitOffline, getDateFormated, getTodayDateFormatted } from './KitTongouController.js';
import { CalculTKwhEnAriaryTTC, CalculTroisDernierFacture } from '../JiramaCalculController.js';
import { ReponseIAKit } from '../ChatController.js';
import { ReponseIACreateKitUser } from './KitTongouIAController.js';
import { formatYYYYMMDDtoDate } from './KitTongouAutoReleveController.js';
import { formatDateToYYYYMMDD } from '../Electricite/AutoReleveController.js';

config();

const prisma = new PrismaClient()
const end_point_ogemray = process.env.END_POINT_OGEMRAY;
const grand_type = process.env.GRANT_TYPE;
const code = process.env.CODE;
const client_id = process.env.CLIENT_ID;
const sign_method = process.env.SIGN_METHOD;
const key_tongou = process.env.KEY_TONGOU;
const user_id = process.env.USER_ID;
const asset_id = process.env.ASSET_ID;
const port_ecozipo = process.env.PORT_ECOZIPO;


/**
 * GET ALL USER COMMUNAUTE
 */
export const getAllUserForCommunaute = async (req, res) => {
  try {
    const compteElectriciteHaveKit = await prisma.compteElectriciteEau.findMany({
      where: {
        statusDisjoncteur: true
      },
      include: {
        Utilisateur: true
      },
      orderBy: {
        id: "desc"
      }
    });

    let lastWeek = getLastWeekRange();

    let response = []

    for (let index = 0; index < compteElectriciteHaveKit.length; index++) {
      let compteElectriciteEauId = compteElectriciteHaveKit[index].id;
      let consoDernierMoisKit = compteElectriciteHaveKit[index].consoDernierMoisKit;
      let jourConsommation = compteElectriciteHaveKit[index].joursConsommation
      let semaine = 4
      if(consoDernierMoisKit == null){
        let mois1 = compteElectriciteHaveKit[index].mois1
        let mois2 = compteElectriciteHaveKit[index].mois2
        let mois3 = compteElectriciteHaveKit[index].mois3
        let min = Math.min(mois1, mois2, mois3)
        consoDernierMoisKit = min
      }
      let consommationParJour = consoDernierMoisKit / jourConsommation
      let consommationParSemaine = consoDernierMoisKit / semaine

      // console.log("compteElectriciteEauId : ",compteElectriciteEauId);
      // console.log("consoDernierMoisKit : ",consoDernierMoisKit);
      // console.log("consommationParSemaine : ",consommationParSemaine);
      // console.log("consommationParJour : ",consommationParJour);
      let start_time = formatDateToYYYYMMDD(lastWeek.start_time)
      let end_time = formatDateToYYYYMMDD(lastWeek.end_time)
      // console.log("start_time : ",start_time);
      // console.log("end_time : ",end_time);

      // trouver les kits user principal par rapport au compteur
      const kitsUserPrincipal = await prisma.kitTongouUser.findMany({
        where: {
          AND: [
            { compteElectriciteEauId: parseInt(compteElectriciteEauId) },
            { KitTongou: {
                KitType: {
                  id : 1
                }
            }}
          ]
        },
        include: {
          KitTongou: true,
          CompteElectriciteEau: true
        }
      });

      let kitTongouId = kitsUserPrincipal[0].KitTongou.id;

       /**
       * get lat & long kit
       */
     
       const weatherKit = await prisma.weatherKit.findFirst({
        where: {
         kitTongouId: kitTongouId
        }
      });
      
      let consommationKitWeek = 0


      for (let index = 0; index < kitsUserPrincipal.length; index++) {
        let device_id = kitsUserPrincipal[index].KitTongou.idKitTongou;
        // console.log("device_id : ",device_id);
        let rep_consommation_mois = await functionGetStatisticsKitTongou(device_id, "add_ele", start_time, end_time, "sum", "days");
        
        let totalConsommation = Object.values(rep_consommation_mois.data.result).reduce((acc, value) => acc + value, 0);
        consommationKitWeek = consommationKitWeek + totalConsommation

      
      }

      if(consommationKitWeek > 0){   
        // get avis user
        let utilisateur = compteElectriciteHaveKit[index].utilisateurId
        let avisUser = await prisma.communauteAvis.findFirst({
          where: {
            utilisateurId: utilisateur.id
          }
        })
        
        let pourcentage = ((consommationKitWeek - consommationParSemaine)/ consommationParSemaine) * 100
        compteElectriciteHaveKit[index].emplacement = weatherKit
        compteElectriciteHaveKit[index].pourcentage = pourcentage
        if(avisUser) compteElectriciteHaveKit[index].avisUser = avisUser

        response.push({
          ...compteElectriciteHaveKit[index],
        });
      }

    }


    compteElectriciteHaveKit.sort((a, b) => a.pourcentage - b.pourcentage)
    

    res.status(200).json({
      Msg: "Listes des communauté",
      TotalCount: response.length,
      Data: response,
    });

  } catch (error) {
    res.status(500).json({ messageError: error.message});
  }
};




function getLastWeekRange() {
  let now = new Date();
  now.setHours(now.getHours() + 3);

  // Trouver le lundi de la semaine actuelle
  let currentWeekStart = new Date(now);
  currentWeekStart.setDate(now.getDate() - now.getDay() + 1);

  // Début et fin de la semaine dernière
  let lastWeekStart = new Date(currentWeekStart);
  lastWeekStart.setDate(currentWeekStart.getDate() - 7); // Lundi de la semaine dernière

  let lastWeekEnd = new Date(lastWeekStart);
  lastWeekEnd.setDate(lastWeekStart.getDate() + 6); // Dimanche de la semaine dernière

  return {
      start_time: lastWeekStart,
      end_time: lastWeekEnd
  };
}




/**
 * GET USER AVIS COMMUNAUTE
 */
export const getCommunauteAvisByUser = async (req, res) => {
  try {
    const utilisateurId = req.body.utilisateurId
    if(!utilisateurId) return res.status(400).json({ message: "Le champs 'utilisateurId' est obligatoire.", success: false })
    
    // find utilisateur
    const utilisateur = await prisma.utilisateur.findUnique({
      where: {
        id: parseInt(utilisateurId)
      }
    })
    if(!utilisateur) return res.status(404).json({ message: "Cet utilisateur n'existe pas.", success: false })
    
    // find if user have already an avis
    const avisExist = await prisma.communauteAvis.findFirst({
      where: {
        utilisateurId: parseInt(utilisateurId)
      }
    })
    if(!avisExist) return res.status(404).json({ message: "Cet utilisateur n'a pas encore d'avis.", success: false })


    res.status(200).json({
      message: `Avis de l'utilisateur ${utilisateur.pseudo || utilisateur.email}`,
      Data: avisExist,
      success: true
    });

  } catch (error) {
    console.error(`Erreur lors la recupération d'avis de communauté : `,error)
    res.status(500).json({ message: error.message, success: false});
  }
};


/**
 * CREATE USER AVIS COMMUNAUTE
 */
export const createCommunauteAvis = async (req, res) => {
  try {
    const utilisateurId = req.body.utilisateurId
    if(!utilisateurId) return res.status(400).json({ message: "Le champs 'utilisateurId' est obligatoire.", success: false })
    
    // find utilisateur
    const utilisateur = await prisma.utilisateur.findUnique({
      where: {
        id: parseInt(utilisateurId)
      }
    })
    if(!utilisateur) return res.status(404).json({ message: "Cet utilisateur n'existe pas.", success: false })
    
    // find if user have already an avis
    const avisExist = await prisma.communauteAvis.findFirst({
      where: {
        utilisateurId: parseInt(utilisateurId)
      }
    })
    if(avisExist) return res.status(400).json({ message: "Vous avez déjà un avis.", success: false })


    // create communaute avis
    const createCommunauteAvis = await prisma.communauteAvis.create({
      data: {
        utilisateurId: parseInt(utilisateurId)
      }
    })

    res.status(200).json({
      message: `Avis de l'utilisateur ${utilisateur.pseudo || utilisateur.email} a été créé`,
      Data: createCommunauteAvis,
      success: true
    });

  } catch (error) {
    console.error(`Erreur lors du création d'avis de communauté : `,error)
    res.status(500).json({ message: error.message, success: false});
  }
};




/**
 * UPDATE USER AVIS COMMUNAUTE
 */
export const updateCommunauteAvis = async (req, res) => {
  try {
    const utilisateurId = req.body.utilisateurId
    let {statistique, avis} = req.body
    if(!utilisateurId) return res.status(400).json({ message: "Le champs 'utilisateurId' est obligatoire.", success: false })
    
    // find utilisateur
    const utilisateur = await prisma.utilisateur.findUnique({
      where: {
        id: parseInt(utilisateurId)
      }
    })
    if(!utilisateur) return res.status(404).json({ message: "Cet utilisateur n'existe pas.", success: false })
    
    // find if user have already an avis
    const avisExist = await prisma.communauteAvis.findFirst({
      where: {
        utilisateurId: parseInt(utilisateurId)
      }
    })
    if(!avisExist) return res.status(400).json({ message: "Vous n'avez pas encore crée l'avis communauté", success: false })


    if(!statistique) statistique = avisExist.statistique
    if(!avis) avis = avisExist.avis

    if(statistique > 5) return res.status(400).json({ message: "La maximum du stat est 5", success: false })

    // update communaute avis
    const updateCommunauteAvis = await prisma.communauteAvis.update({
      where:{
        id : avisExist.id
      },
      data: {
        avis : avis,
        statistique: parseInt(statistique)
      }
    })

    res.status(200).json({
      message: `L'avis de l'utilisateur ${utilisateur.pseudo || utilisateur.email} a été mise à jour`,
      Data: updateCommunauteAvis,
      success: true
    });

  } catch (error) {
    console.error(`Erreur lors du modification d'avis de communauté : `,error)
    res.status(500).json({ message: error.message, success: false});
  }
};