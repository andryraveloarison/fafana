import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv';
import axios from 'axios'
import axiosRetry from 'axios-retry'
import crypto from 'crypto';
import { getTokens } from '../../utils/tokenStore.js';
import { GenerateSign } from '../ConfigController.js';
import { functionGetStatisticsKitTongou, functionGetStatusKitTongou, functionSeeKitOffline, getDateFormated, getTodayDateFormatted } from './KitTongouController.js';
import { CalculTKwhEnAriaryTTC, CalculTroisDernierFacture } from '../JiramaCalculController.js';
import { ReponseIAKit } from '../ChatController.js';
import { ReponseIACreateKitUser } from './KitTongouIAController.js';
import { getConsommationKitTongouMois } from './KitTongouUserController.js';

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
 * GET ALL KIT TONGOU USER ECOZIPO
 */
export const getAllAutoReleveByKitPrincipale = async (req, res) => {
  try {
    const { idKitTongou } = req.body;
    if(!idKitTongou) return res.status(400).json({ message: "Veuillez ajouter l'ID du kit.", success: false });
    
    // trouver le kit si principale
    const kitPrincipale = await prisma.kitTongou.findFirst({
      where: {
        idKitTongou: idKitTongou
      },
      include: {
          KitType: true,
          KitTypeTongou: true
      }
    });
    if(!kitPrincipale) return res.status(404).json({ message: "Ce kit n'existe pas", success: false });
    if(kitPrincipale.KitType.id !== 1) return res.status(400).json({ message: "Ce kit n'est pas un kit principale", success: false });


    // trouver tout les relevées ajoutés
    const autoReleve = await prisma.kitTongouAutoReleve.findMany({
      where: {
        kitTongouId: kitPrincipale.id
      },
      orderBy: {
        createdAt: 'desc', 
      },
    });

   
    res.status(200).json({
      Msg: `Liste auto relevé du kit principale ${kitPrincipale.pseudo} (${kitPrincipale.idKitTongou})`,
      TotalCount: autoReleve.length,
      Data: autoReleve,
    });

  } catch (error) {
    res.status(500).json({ messageError: error.message});
  }
};





/**
 * ADD AUTO RELEVE KIT TONGOU
 */
export const addAutoReleveKitTongou = async (req, res) => {
  try {
    let { idKitTongou, indexAjouter } = req.body;
    if(!idKitTongou) return res.status(400).json({ message: "Veuillez renseigner l'id du kit", success: false })
    
    // find kit tongou user by id kit
    let response = await prisma.kitTongou.findFirst({
      where: {
        idKitTongou: idKitTongou
      },
      include: {
          KitType: true,
          KitTypeTongou: true
      }
    });
    
    if(!response) return res.status(404).json({ message: "Ce kit n'existe pas", success: false })
    if(response.KitType.id !== 1) return res.status(400).json({ message: "Ce kit n'est pas un kit principale", success: false })

    // trouver la date d'ajout du kit dans KitTongouUser
    const kitTongouUser = await prisma.kitTongouUser.findFirst({
      where: {
        kitTongouId: response.id,
      },
      orderBy: {
        createdAt: 'desc', 
      },
    });
    
    // trouver si le kit a déjà fait une auto releve
    const kitAutoReleve = await prisma.kitTongouAutoReleve.findFirst({
      where: {
        kitTongouId: response.id,
      },
      orderBy: {
        createdAt: 'desc', 
      },
    });



    let start_time = ""
    let end_time = formatDateToYYYYMMDD(new Date())
    // let end_time = "20250106"
    let device_id = response.idKitTongou
    let ancienIndex = 0

    if(!kitAutoReleve){
      start_time = formatDateToYYYYMMDD(kitTongouUser.createdAt)
      ancienIndex = response.consommationInitial
    }else{
      const originalDate = new Date(kitAutoReleve.createdAt); // Date originale
      // originalDate.setDate(originalDate.getDate() + 1); // Ajouter 1 jour
      start_time = formatDateToYYYYMMDD(originalDate)
      ancienIndex = kitAutoReleve.indexAjouter
    }

    if(ancienIndex === null) return res.status(400).json({ message: "Vous devez initialisé votre ancien index dans votre kit principale.", success: false });
    

    console.log("start_time", start_time)
    console.log("end_time", end_time)
    
    
    let rep_consommation_mois = ""

    try { 
      rep_consommation_mois = await functionGetStatisticsKitTongou(device_id, "add_ele", start_time, end_time, "sum", "days");

    } catch (error) { 
      console.error("Erreur de récupération des valeurs sur le serveur : ", error);
      return res.status(400).json({  message: error.message, success: false});
    }

    if(rep_consommation_mois.data.success === false) return res.status(400).json({  message: error.message, success: false});
    // console.log("rep_consommation_mois.data : ",rep_consommation_mois.data);
    

    let joursConsommation = Object.keys(rep_consommation_mois.data.result).length;
    let consommation = Object.values(rep_consommation_mois.data.result).reduce((acc, value) => acc + value, 0);
    consommation = parseFloat(consommation.toFixed(2));
    let total = 0

    
    if(!kitAutoReleve){
      total = ancienIndex + consommation
    }else{
      total = ancienIndex + consommation + kitAutoReleve.reste
    }


    if(!indexAjouter) indexAjouter = total
    if(indexAjouter > total) return res.status(400).json({ message: `L'index à ajouter doit être inférieur ou égal à ${total}kwh`, success: false })
    
    let reste = parseFloat(total - parseFloat(indexAjouter)).toFixed(2);

    console.log("kitTongouId : ",response.id);
    console.log("index : ",ancienIndex);
    console.log("consommation : ",consommation);
    console.log("total : ",total);
    console.log("indexAjouter : ",indexAjouter);
    console.log("reste : ",reste);
    console.log("joursConsommation : ",joursConsommation);
    
    if(joursConsommation === 1) return res.status(400).json({ message: `Vous avez déjà envoyé votre auto relevé aujourd'hui`, success: false })

    // add auto releve
    const addAutoReleve = await prisma.kitTongouAutoReleve.create({
      data:{
          kitTongouId: response.id,
          index: ancienIndex,
          consommation: consommation,
          total: total,
          indexAjouter: parseFloat(indexAjouter),
          reste: parseFloat(reste),
          joursConsommation: joursConsommation
      }
    });
    

    res.status(200).json({
      Msg: `La consommation initiale du kit principale ${response.pseudo} (${response.idKitTongou}) a été mise à jour`,
      Data: addAutoReleve,
      success: true
    });

  } catch (error) {
    console.error("Erreur lors d'ajout auto releve kit tongou : ", error);
    res.status(500).json({
      message: error.message,
      success: false
    });
  }
};




/**
 * UPDATE AUTO RELEVE KIT TONGOU
 */
export const updateAutoReleveKitTongou = async (req, res) => {
  try {
    const { idKitTongou, consommationInitial } = req.body;
    if(!idKitTongou) return res.status(400).json({ message: "Veuillez renseigner l'id du kit", success: false })
    if(!consommationInitial) return res.status(400).json({ message: "Veuillez renseigner la consommation initiale de votre compteur", success: false })

    // find kit tongou user by id kit
    let response = await prisma.kitTongou.findFirst({
      where: {
        idKitTongou: idKitTongou
      },
      include: {
          KitType: true,
          KitTypeTongou: true
      }
    });
    
    if(!response) return res.status(404).json({ message: "Ce kit n'existe pas", success: false })
    if(response.KitType.id !== 1) return res.status(400).json({ message: "Ce kit n'est pas un kit principale", success: false })
    if(response.consommationInitial !== null) return res.status(400).json({ message: "Vous ne pouvez pas modifier la consommation initiale, veuillez contacter le service client", success: false })
    // update auto releve
    await prisma.kitTongou.update({
      where: {
        id: response.id
      },
      data: {
        consommationInitial: parseFloat(consommationInitial)
      }
    });

    response = await prisma.kitTongou.findFirst({
      where: {
        idKitTongou: idKitTongou
      },
      include: {
          KitType: true,
          KitTypeTongou: true
      }
    });

    res.status(200).json({
      Msg: `La consommation initiale du kit principale ${response.pseudo_kit} (${response.device_id}) a été mise à jour`,
      TotalCount: response.length,
      Data: response,
    });

  } catch (error) {
    console.error("Erreur lors de la mise à jour du kit principale : ", error);
    res.status(500).json({
      message: error.message,
      success: false
    });
  }
};



/**
 * NOTIFICATION AUTO RELEVE KIT TONGOU
 */
export async function notificationAutoReleveByWeek(io){
  try {
    // get all kit principale (disjoncteur)
    const KitTongouPrincipale = await prisma.kitTongou.findMany({
      where: {
        AND: [
          { status: true },
          { kitTypeId: 1 },
          { consommationInitial: { not: null } }
        ]
      },
      include: {
        KitType: true,
        KitTypeTongou: true
    }
    });

    for (let index = 0; index < KitTongouPrincipale.length; index++) {
      let kitTongouId = KitTongouPrincipale[index].id
      let device_id = KitTongouPrincipale[index].idKitTongou

      // find Table KitTongouUser
      let kitTongouUser = await prisma.kitTongouUser.findFirst({
        where: {
          kitTongouId: kitTongouId
        }
      }); 
      let utilisateurId = kitTongouUser.utilisateurId

      

      
      // find KitTongouAutoReleve
      let kitAutoReleve = await prisma.kitTongouAutoReleve.findFirst({
        where: {
          kitTongouId: kitTongouId
        },
        orderBy: {
          createdAt: 'desc', 
        },
      }); 
      

      
      let start_time = ""
      let end_time = formatDateToYYYYMMDD(new Date())
      // let end_time = "20250106"
      let ancienIndex = 0

      if(!kitAutoReleve){
        start_time = formatDateToYYYYMMDD(kitTongouUser[index].createdAt)
        ancienIndex = KitTongouPrincipale[index].consommationInitial
      }else{
        const originalDate = new Date(kitAutoReleve.createdAt); // Date originale
        originalDate.setDate(originalDate.getDate() + 1); // Ajouter 1 jour
        start_time = formatDateToYYYYMMDD(originalDate)
        ancienIndex = kitAutoReleve.indexAjouter
      }
      
      let rep_consommation_mois = ""

      try { 
        rep_consommation_mois = await functionGetStatisticsKitTongou(device_id, "add_ele", start_time, end_time, "sum", "days");

      } catch (error) { 
        console.error("Erreur de récupération des valeurs sur le serveur : ", error);
        return res.status(400).json({  message: error.message, success: false});
      }

      if(rep_consommation_mois.data.success === false) return res.status(400).json({  message: error.message, success: false});


      let joursConsommation = Object.keys(rep_consommation_mois.data.result).length;
      let consommation = Object.values(rep_consommation_mois.data.result).reduce((acc, value) => acc + value, 0);
      consommation = parseFloat(consommation.toFixed(2));
      let total = 0

      
      if(!kitAutoReleve){
        total = ancienIndex + consommation
      }else{
        total = ancienIndex + consommation + kitAutoReleve.reste
      }

      
      io.emit('notifAutoReleve', {
        message: `Voulez vous ajouter votre auto relevé?`,
        value : `${total}Kwh`,
        jourConsommation : joursConsommation,
        utilisateurId : utilisateurId,
        kitTongouId: kitTongouId
      });
    }

    let message = "Les notifications des auto relevés ont été envoyées avec succès.";

    console.log("message : ",message);  

  } catch (error) {
    console.error("message", error.message);
  }
};






export function formatDateToYYYYMMDD(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Ajouter un zéro si nécessaire
  const day = String(date.getDate()).padStart(2, '0'); // Ajouter un zéro si nécessaire
  return `${year}${month}${day}`;
}


export function formatYYYYMMDDtoDate(date) {
  let year = parseInt(date.substring(0, 4));
  let month = parseInt(date.substring(4, 6)) - 1; // Les mois sont 0-indexés
  let day = parseInt(date.substring(6, 8));


  return new Date(year, month, day);
}