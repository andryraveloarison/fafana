import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv';
import axios from 'axios'
import axiosRetry from 'axios-retry'
import crypto from 'crypto';
import { getTokens } from '../../utils/tokenStore.js';
import { GenerateSign } from '../ConfigController.js';
import { consommationJourIA, consommationSemaineIA, kitTongouHorsLigneIA, surIntensiteIA, surPuissanceIA, surTensionIA } from './KitTongouIAController.js';
import { CalculTKwhEnAriaryTTC } from '../JiramaCalculController.js';
import { format, startOfWeek, endOfWeek, subWeeks} from 'date-fns';
import { getConsommationKitTongouMois } from './KitTongouUserController.js';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration.js';
import cron from 'node-cron'

dayjs.extend(duration);
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
 * GET KIT IN SERVER TONGOU
 */
export const getAllKitTongou = async (req, res) => {
  try {
    let isValid = false;
    let response = {};
    let retries = 0; 

    while (!isValid && retries < 3) {
      let tokens = getTokens();

      // Vérifier si le token est manquant ou invalide
      if (tokens.accessToken === null || response?.data?.msg === "token invalid") {
        
        try {
          await axios.get(`${port_ecozipo}/gettokentongou`);
          tokens = getTokens();
          
        } catch (error) {
          return res
            .status(500)
            .json({ messageError: "Vous êtes hors ligne, veuillez vérifier votre connexion!" });
        }
      }
      const method = "GET";
      const url = `/v1.0/cloud/energy/micro/assets/${asset_id}/devices?user_id=${user_id}`;
      const access_token = tokens.accessToken;
      const body = "";

      const generateSign = await GenerateSign(access_token, body, client_id, key_tongou, url, method);

      const headers = {
        client_id: generateSign.sign_rep.client_id,
        access_token: generateSign.sign_rep.access_token,
        sign: generateSign.sign_rep.sign,
        t: generateSign.sign_rep.t,
        sign_method: generateSign.sign_rep.sign_method,
      };

      try {
        response = await axios.get(`${end_point_ogemray}${url}`, { headers });

        if (response.data.success) {
          isValid = true; 
        } else {
          console.error("Response error:", response.data.msg);
          retries++;
        }
      } catch (error) {
        console.error("Request error:", error.message);
        retries++;
      }
      // console.log("response.data : ",response.data);
    }

    if (isValid) {
      for (let index = 0; index < response.data.result.length; index++) {
        let device_id = response.data.result[index].id
        // find if this kits exist in our database
        const kitExit = await prisma.kitTongou.findFirst({
          where:{
            idKitTongou : device_id
          }
        })
        if(kitExit) response.data.result[index].exist = true
        else response.data.result[index].exist = false  
      }
      return res.status(200).json(response.data);
    } else {
      return res
        .status(400)
        .json({ messageError: "Impossible de récupérer les données après plusieurs tentatives." });
    }
  } catch (error) {
    console.error("Unexpected error:", error.message);
    return res.status(500).json({
      messageError: "Erreur lors de la récupération des données.",
      error: error.message,
    });
  }
};



/**
 *
 *  GET KIT IN OUR SERVER
 *
 */

export const getAllKitEcozipoTongou = async (req, res) => {
  try {

    const response = await prisma.kitTongou.findMany({
      orderBy: {
        id: 'asc',
      },
      include: {
        KitType: true,
        KitGroupeTongou: true, 
        KitTypeTongou: true
      }
    });



    // for (let index = 0; index < response.length; index++) {
    //     let id = response[index].id 
    //     let device_id = response[index].idKitTongou;
    //     let rep_consommation_mois = {}
    //     let dateReleve = ""

    //     // find kitTongouUser by kitTongouId
    //     const kitTongouUser = await prisma.kitTongouUser.findFirst({
    //       where: {
    //         kitTongouId: id
    //       },
    //     });
    //     let utilisateurId = kitTongouUser.utilisateurId
    //     let compteElectriciteEauId = kitTongouUser.compteElectriciteEauId

    //     // find compteElectriciteEau
    //     let compteElectriciteEau = await prisma.compteElectriciteEau.findUnique({
    //       where: {
    //         id: compteElectriciteEauId
    //       }
    //     });
        
    //     dateReleve = compteElectriciteEau.dateReleve

        
        
    //     rep_consommation_mois = await getConsommationKitTongouMois(device_id, compteElectriciteEauId, dateReleve);
    //     console.log("rep_consommation_mois : ",rep_consommation_mois.data);
        
    //     console.log("-----------------");
      
    // }


    // Si la requête réussit, on retourne la réponse
    res.json({
      Msg: "Liste des kits de tongou Ecozipo",
      TotalCount: response.length,
      Data: response
    });

  } catch (error) {
    // Affiche l'erreur dans la console pour plus de détails
    console.error("Erreur lors de la récupération des kits:", error);

    // Envoie un message d'erreur détaillé dans la réponse
    res.status(500).json({
      messageError: 'Erreur serveur',
      details: error.message || "Erreur inconnue",
    });
  }
};



export const addKitTongouInEcozipo = async (req, res) => {
  try {
    let {idKitTongou, kitTypeId, kitTypeTongouId} = req.body;
    if(!idKitTongou || !kitTypeId || !kitTypeTongouId) return res.status(400).json({ message: "Les champs 'kitTypeTongouId', 'idKitTongou' et 'kitTypeId' sont obligatoires.", success: false })
   
    const getKit = await axios.get(`${port_ecozipo}/getallkittongou`);

    let { name, online, product_id, product_name, icon, category} = ''

    let valid = false
    for (let index = 0; index < getKit.data.result.length; index++) {
      let idKitTongouOnline = getKit.data.result[index].id
      if(idKitTongou == idKitTongouOnline){
        valid = true
        name = getKit.data.result[index].name
        online = getKit.data.result[index].online
        product_id = getKit.data.result[index].product_id
        product_name = getKit.data.result[index].product_name
        icon = getKit.data.result[index].icon
        category = getKit.data.result[index].category
      }
    }

    if(!valid) return res.status(404).json({ message: "Ce kit n'existe pas", success: false })

    const kitExit = await prisma.kitTongou.findFirst({
      where:{
        idKitTongou : idKitTongou
      }
    })
    if(kitExit) return res.status(400).json({ message: "Ce kit existe déjà", success: false })

    // // find if kit type exist
    const typeKit = await prisma.kitType.findUnique({
      where: {
        id: parseInt(kitTypeId)
      }
    });
    if(!typeKit) return res.status(400).json({ message: "Le type de kit n'existe pas", success: false })

   
    // find KitTypeTongou if exist
    const KitTypeTongou = await prisma.kitTypeTongou.findUnique({
      where: {
        id: parseInt(kitTypeTongouId)
      }
    });
    if(!KitTypeTongou) return res.status(400).json({ message: "Le groupe de kit n'existe pas", success: false })
      
    let data =  {
      idKitTongou : idKitTongou,
      name : name,
      pseudo : name,
      online : online,
      product_id : product_id,
      product_name : product_name,
      icon : icon,
      category : category,
      kitTypeTongouId: parseInt(kitTypeTongouId),
      KitGroupeTongouId: 1,
      kitTypeId: parseInt(kitTypeId)
  }

    await prisma.kitTongou.create({
      data: data
    });
    data.KitType = typeKit;
    data.KitTypeTongou = KitTypeTongou;

    res.status(201).json({
        message: "Le kit est ajouté dans l'ecozipo",
        data: data,
        success: true
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      success: false
    });
  }
};



export const updateKitTongouInEcozipo = async (req, res) => {
  try {
    let idKitTongou = req.body.idKitTongou;
    let { pseudo, kitTypeTongouId } = req.body;

    // find kittongou
    const kitTongouExist = await prisma.kitTongou.findFirst({
      where: {
        idKitTongou: idKitTongou
      }
    });
    if(!kitTongouExist) return res.status(404).json({ message: "Ce kit n'existe pas", success: false })

   
    const updatekitTongou = await prisma.kitTongou.update({
      where: {
        id: kitTongouExist.id
      },
      data: {
          pseudo : pseudo || kitTongouExist.pseudo,
          kitTypeTongouId : parseInt(kitTypeTongouId) || kitTongouExist.kitTypeTongouId
      },
      include: {
        KitType: true,
        KitGroupeTongou: true,
        KitTypeTongou: true
      }
    });

    res.status(201).json({
        message: "Votre kit a été mis à jour",
        data: updatekitTongou,
        success: true
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      success: false
    });
  }
};



/**
 *
 *  
 * NOTIFICATION CONSOMMATION
 *
 * 
 */

/**
 *  notification consommation par jour 
 */
export async function notificationConsommationByDay (io, seuil){
  try {
    // get all kit principale (disjoncteur)
    const KitTongouPrincipale = await prisma.kitTongou.findMany({
      where: {
        AND: [
          { status: true },
          { kitTypeId: 1 }
        ]
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
      let compteElectriciteEauId = kitTongouUser.compteElectriciteEauId

      let utilisateurFind = await prisma.utilisateur.findUnique({
        where: {
          id: utilisateurId
        }
      })
      let statusNotif = utilisateurFind.statusNotif

      // get consommation par jour
      const todayFormatted = getTodayDateFormatted();
      let rep_consommation = await functionGetStatisticsKitTongou(device_id, "add_ele", todayFormatted, todayFormatted, "sum", "days"); 
      if(rep_consommation.data){
        const value1Data = rep_consommation.data.result;
        const consommationKWh = Object.values(value1Data)[0]; 
        const prixttt = await CalculTKwhEnAriaryTTC(compteElectriciteEauId, consommationKWh)
        const prix = prixttt.data.prixTotalTranche

        let data = {
          consommationKWh,
          prix, 
          seuil: seuil
        }
        
        const reponseIA = await consommationJourIA (data)  
        
        console.log("reponseIA", reponseIA.message)
        
        
        if(statusNotif){
          io.emit('notifConsommation', {
            message: reponseIA.message,
            type: "alerte",
            utilisateurId : utilisateurId,
            kitTongouId: kitTongouId
          });
        }   

        await prisma.notification.create({
          data:{
              message: reponseIA.message,
              type: "alerte",
              utilisateurId : utilisateurId,
              kitTongouId: kitTongouId
        }})  
      }
    }

    let message = ""
    if(seuil === 1) message = `Les notifications de 12 dernières heures ont été envoyées.`
    else if(seuil === 2) message = `Les notifications de 24 dernières heures ont été envoyées.`

    console.log("message : ",message);
  

  } catch (error) {
    console.error("message", error.message);
  }
};


/**
 * notification par semaine
 */
export async function notificationConsommationByWeek(io){
  try {
    // get all kit principale (disjoncteur)
    const KitTongouPrincipale = await prisma.kitTongou.findMany({
      where: {
        AND: [
          { status: true },
          { kitTypeId: 1 }
        ]
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

      let utilisateurFind = await prisma.utilisateur.findUnique({
        where: {
          id: utilisateurId
        }
      })
      let statusNotif = utilisateurFind.statusNotif
      

      // get consommation par jour
      let today = new Date()
      const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 }); // Lundi
      const endOfCurrentWeek = endOfWeek(today, { weekStartsOn: 1 }); // Dimanche

      // Détecte lundi de la semaine précédente
      const startOfPreviousWeek = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 }); // Lundi précédent
      const endOfPreviousWeek = endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 }); // Dimanche précédent


      let startimeAvant = format(startOfPreviousWeek, 'yyyyMMdd')
      let endtimeAvant = format(endOfPreviousWeek, 'yyyyMMdd')
      let startimeNow = format(startOfCurrentWeek, 'yyyyMMdd')
      let endtimeNow = format(endOfCurrentWeek, 'yyyyMMdd')

      

      let rep_consommation_avant = await functionGetStatisticsKitTongou(device_id, "add_ele", startimeAvant, endtimeAvant, "sum", "days"); 
      let rep_consommation_now = await functionGetStatisticsKitTongou(device_id, "add_ele", startimeNow, endtimeNow, "sum", "days"); 

      if(rep_consommation_avant.data || rep_consommation_now.data){
        
        const consommationKWhAvant = Object.values(rep_consommation_avant.data.result).reduce((acc, value) => acc + value, 0);
        const consommationKWhNow = Object.values(rep_consommation_now.data.result).reduce((acc, value) => acc + value, 0);
        
        let data = {
          consommationKWhAvant,
          consommationKWhNow
        }
        
        const reponseIA = await consommationSemaineIA(data)  
        
       
        if(statusNotif){
          io.emit('notifConsommation', {
            message: reponseIA.message,
            type: "alerte",
            utilisateurId : utilisateurId,
            kitTongouId: kitTongouId
          });
        }

        await prisma.notification.create({
          data:{
              message: reponseIA.message,
              type: "alerte",
              utilisateurId : utilisateurId,
              kitTongouId: kitTongouId
        }})  
      }
    }

    let message = "Les notification par semaines sont envoyées"

    console.log("message : ",message);  

  } catch (error) {
    console.error("message", error.message);
  }
};




export const testNotif = async (req, res) => {
  try {
    // get all kit principale (disjoncteur)
    const KitTongouPrincipale = await prisma.kitTongou.findMany({
      where: {
        AND: [
          { status: true },
          { kitTypeId: 1 }
        ]
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

      // get consommation par jour
      let today = new Date()
      const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 }); // Lundi
      const endOfCurrentWeek = endOfWeek(today, { weekStartsOn: 1 }); // Dimanche

      // Détecte lundi de la semaine précédente
      const startOfPreviousWeek = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 }); // Lundi précédent
      const endOfPreviousWeek = endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 }); // Dimanche précédent


      let startimeAvant = format(startOfPreviousWeek, 'yyyyMMdd')
      let endtimeAvant = format(endOfPreviousWeek, 'yyyyMMdd')
      let startimeNow = format(startOfCurrentWeek, 'yyyyMMdd')
      let endtimeNow = format(endOfCurrentWeek, 'yyyyMMdd')

      

      let rep_consommation_avant = await functionGetStatisticsKitTongou(device_id, "add_ele", startimeAvant, endtimeAvant, "sum", "days"); 
      let rep_consommation_now = await functionGetStatisticsKitTongou(device_id, "add_ele", startimeNow, endtimeNow, "sum", "days"); 

      if(rep_consommation_avant.data || rep_consommation_now.data){
        
        const consommationKWhAvant = Object.values(rep_consommation_avant.data.result).reduce((acc, value) => acc + value, 0);
        const consommationKWhNow = Object.values(rep_consommation_now.data.result).reduce((acc, value) => acc + value, 0);
        
        let data = {
          consommationKWhAvant,
          consommationKWhNow
        }
        
        const reponseIA = await consommationSemaineIA(data)  
        
        req.io.emit('notifConsommation', {
          message: reponseIA.message,
          type: "alerte",
          utilisateurId : utilisateurId,
          kitTongouId: kitTongouId
        });

        await prisma.notification.create({
          data:{
              message: reponseIA.message,
              type: "alerte",
              utilisateurId : utilisateurId,
              kitTongouId: kitTongouId
        }})  
      }
    }

    let message = "Les notification par semaines sont envoyées"

    console.log("message : ",message);  

  } catch (error) {
    console.error("message", error.message);
  }
};








/***
 * 
 * KIT CONTROLLER
 */
export const getStatusKitTongou = async (req, res) => {
  try {
    const { device_id, code } = req.body;

    const validCodes = [
      "switch", "countdown_1", "add_ele", "cur_current", "cur_power", 
      "cur_voltage", "test_bit", "voltage_coe", "electric_coe", 
      "power_coe", "electricity_coe", "fault", "relay_status", 
      "light_mode", "child_lock", "cycle_time", "temp_value", 
      "alarm_set_1", "alarm_set_2", "online_state"
    ];

    if (!device_id || !code) {
      return res.status(400).json({ message: "Les champs 'device_id' et 'code' sont obligatoires." });
    }

    if (!validCodes.includes(code)) {
      return res.status(400).json({ message: "Code invalide." });
    }

    if (getTokens().accessToken === null) {
      try {
        await axios.get(`${port_ecozipo}/gettokentongou`);
      } catch (error) {
        return res.status(500).json({ messageError: "Vous êtes hors ligne, veuillez vérifier votre connexion!" });
      }
    }

    const method = 'GET';
    const url = `/v1.0/cloud/energy/micro/device/command/${device_id}?user_id=${user_id}&command_code=${code}`;
    const access_token = getTokens().accessToken;
    const body = "";
    const generateSign = await GenerateSign(access_token, body, client_id, key_tongou, url, method);

    const headers = {
      'client_id': generateSign.sign_rep.client_id,
      'access_token': generateSign.sign_rep.access_token,
      'sign': generateSign.sign_rep.sign,
      't': generateSign.sign_rep.t,
      'sign_method': generateSign.sign_rep.sign_method,
    };

    const response = await axios.get(`${end_point_ogemray}${url}`, { headers });

    // console.log("response : ",response.data);
      
    if (response.data.success) {
      const code = response.data.result[0].code;
      let value = parseFloat(response.data.result[0].value); 
    
      if (code === "cur_voltage" || code === "cur_power") {
        value = value / 10; 
      } else if (code === "cur_current") {
        value = value / 1000;
      }
      
      return res.status(201).json({
        message: `Valeur pour le code ${code}`,
        data: { ...response.data, result: [{ code, value: value.toString() }] }
      });
    } else {
      return res.status(400).json({ message: response.data.msg });
    }
    

  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la récupération du token",
      error: error.message
    });
  }
};


export async function functionGetStatusKitTongou (device_id, code, io) {
  try {

    const validCodes = [
      "switch", "countdown_1", "add_ele", "cur_current", "cur_power", 
      "cur_voltage", "test_bit", "voltage_coe", "electric_coe", 
      "power_coe", "electricity_coe", "fault", "relay_status", 
      "light_mode", "child_lock", "cycle_time", "temp_value", 
      "alarm_set_1", "alarm_set_2", "online_state"
    ];

    if (!device_id || !code) {
      return res.status(400).json({ message: "Les champs 'device_id' et 'code' sont obligatoires." });
    }

    if (!validCodes.includes(code)) {
      return res.status(400).json({ message: "Code invalide." });
    }

    if (getTokens().accessToken === null) {
      try {
        await axios.get(`${port_ecozipo}/gettokentongou`);
      } catch (error) {
        return res.status(500).json({ messageError: "Vous êtes hors ligne, veuillez vérifier votre connexion!" });
      }
    }

    const method = 'GET';
    const url = `/v1.0/cloud/energy/micro/device/command/${device_id}?user_id=${user_id}&command_code=${code}`;
    const access_token = getTokens().accessToken;
    const body = "";
    const generateSign = await GenerateSign(access_token, body, client_id, key_tongou, url, method);

    const headers = {
      'client_id': generateSign.sign_rep.client_id,
      'access_token': generateSign.sign_rep.access_token,
      'sign': generateSign.sign_rep.sign,
      't': generateSign.sign_rep.t,
      'sign_method': generateSign.sign_rep.sign_method,
    };

    const response = await axios.get(`${end_point_ogemray}${url}`, { headers });


    /**
     *  ALERTE
     */
    if(code === "cur_voltage" || code === "cur_power" || code === "cur_current"){
      // find KitTongou
      const kitTongou = await prisma.kitTongou.findFirst({
        where: {
          idKitTongou: device_id,
        },
      });
      

      // find KitTongouUser by kitTongouId
      const kitTongouUser = await prisma.kitTongouUser.findFirst({
        where: {
          kitTongouId: kitTongou.id,
        },
      });

      let utilisateurId = kitTongouUser.utilisateurId
      let compteElectriciteEauId = kitTongouUser.compteElectriciteEauId

       // find compteElectriciteEau 
       const compteElectriciteEau = await prisma.compteElectriciteEau.findUnique({
        where: {
          id: parseInt(compteElectriciteEauId)
        },
      });

      // find utilisateur
      const utilisateur = await prisma.utilisateur.findUnique({
        where: {
          id: utilisateurId
        }
      })
      let statusNotif = utilisateur.statusNotif


      let pseudo = kitTongou.pseudo
      let kitTongouId = kitTongou.id
      let puissanceWatt = compteElectriciteEau.puissanceWatt
      let intensite = compteElectriciteEau.intensite

      
       // surpuissance
      if(code === "cur_power"){
        let puissanceValue = parseFloat(response.data.result[0].value) / 10;
        // let puissanceValue = 3400
        // console.log("puissanceValue : ",puissanceValue);
        
        // console.log("puissanceWatt : ",puissanceWatt)
        
        if(puissanceValue > puissanceWatt && puissanceWatt > 0){
          let data = {
            limite: puissanceWatt,
            kit : pseudo
          }
          
          
          const surPuissanceIAMsg = await surPuissanceIA(data)
          if(!surPuissanceIAMsg.messageError){
            console.log("surPuissanceIAMsg : ",surPuissanceIAMsg);

            // socket surpuissance
            if(statusNotif){
              io.emit('surPuissance', {
                message: surPuissanceIAMsg.message,
                type: "alerte",
                utilisateurId : utilisateurId,
                kitTongouId: kitTongouId
              });
            }
  
            // create notification surpuissance
            // await prisma.notification.create({
            //   data:{
            //       message: surPuissanceIAMsg.message,
            //       type: "alerte",
            //       utilisateurId : utilisateurId,
            //       kitTongouId: kitTongouId
            // }})
          }
         
        }
      }

      // sur instensité
      else if(code === "cur_current"){
       let courantValue =  parseFloat(response.data.result[0].value) / 1000;
        // let courantValue = 3400
       
       if(courantValue > intensite && intensite > 0){
         let data = {
           limite: intensite,
           kit : pseudo
         }
         const surIntensiteIAMsg = await surIntensiteIA(data)
         if(!surIntensiteIAMsg.messageError){
            console.log("surIntensiteIAMsg : ",surIntensiteIAMsg);

            // socket intensite
            if(statusNotif){
              io.emit('surPuissance', {
                message: surIntensiteIAMsg.message,
                type: "alerte",
                utilisateurId : utilisateurId,
                kitTongouId: kitTongouId
              });
            }

            // create notification intensite
            // await prisma.notification.create({
            //   data:{
            //       message: surIntensiteIAMsg.message,
            //       type: "alerte",
            //       utilisateurId : utilisateurId,
            //       kitTongouId: kitTongouId
            // }})
         }

         
       }
      } 
      //surtension ou baisse de tension
      else if(code === "cur_voltage"){
        let voltage = parseFloat(response.data.result[0].value) / 10;
        // let voltage = 270
        if(voltage < 200){
          let data = {
            limite: 200,
            kit : pseudo,
            status: "baisse",
          }
          const surTensionIAMsg = await surTensionIA(data)
          if(!surTensionIAMsg.messageError){
            console.log("surTensionIAMsg : ",surTensionIAMsg);
            // socket intensite
            if(statusNotif){
              io.emit('surPuissance', {
                message: surTensionIAMsg.message,
                type: "alerte",
                utilisateurId : utilisateurId,
                kitTongouId: kitTongouId
              });
            }

            // create notification intensite
            // await prisma.notification.create({
            //   data:{
            //       message: surTensionIAMsg.message,
            //       type: "alerte",
            //       utilisateurId : utilisateurId,
            //       kitTongouId: kitTongouId
            // }})
          }
            
          
        }else if(voltage > 250){
          let data = {
            limite: 250,
            kit : pseudo,
            status: "baisse",
          }
          const surTensionIAMsg = await surTensionIA(data)
          if(!surTensionIAMsg.messageError){
            console.log("surTensionIAMsg : ",surTensionIAMsg);
            // socket intensite
            if(statusNotif){
              io.emit('surPuissance', {
                message: surTensionIAMsg.message,
                type: "alerte",
                utilisateurId : utilisateurId,
                kitTongouId: kitTongouId
              });
            }

            // create notification intensite
            // await prisma.notification.create({
            //   data:{
            //       message: surTensionIAMsg.message,
            //       type: "alerte",
            //       utilisateurId : utilisateurId,
            //       kitTongouId: kitTongouId
            // }})
          }
           
        }
      }
     
    }

    if (response.data.success) {
      return {
        message: `Valeur pour le code ${code}`,
        data: response.data
      }
    } else {
      return res.status(400).json({ message: response.data.msg });
    }

  } catch (error) {
    return{
      message: "Erreur lors de la récupération du token",
      error: error.message
    };
  }
};




/***
 * 
 * KIT STATISTIQUES
 */
export const getStatisticsKitTongou = async (req, res) => {
  try {
    const { device_id, code, start_time, end_time, stat_type, time_type } = req.body;

    if (!device_id || !code || !stat_type || !start_time || !end_time) {
      return res.status(400).json({ message: "Les champs 'device_id', 'code', 'stat_type', 'start_time' et 'end_time' sont obligatoires." });
    }

    if (getTokens().accessToken === null) {
      try {
        await axios.get(`${port_ecozipo}/gettokentongou`);
      } catch (error) {
        return res.status(500).json({ messageError: "Vous êtes hors ligne, veuillez vérifier votre connexion!" });
      }
    }

    const method = 'GET';
    const url = `/v1.0/cloud/energy/breaker/devices/${device_id}/statistics?user_id=${user_id}&code=${code}&start_time=${start_time}&end_time=${end_time}&stat_type=${stat_type}&time_type=${time_type}`;
    const access_token = getTokens().accessToken;
    const body = "";
    const generateSign = await GenerateSign(access_token, body, client_id, key_tongou, url, method);

    const headers = {
      'client_id': generateSign.sign_rep.client_id,
      'access_token': generateSign.sign_rep.access_token,
      'sign': generateSign.sign_rep.sign,
      't': generateSign.sign_rep.t,
      'sign_method': generateSign.sign_rep.sign_method,
    };

    const response = await axios.get(`${end_point_ogemray}${url}`, { headers });
    // console.log("response: ",response.data);
    

    if (response.data.success) {
      // Convertir le résultat brut en un objet avec les dates comme clés principales
      const rawResult = response.data.result;
      const resultFormatted = rawResult.slice(1, -1).split(', ').reduce((acc, entry) => {
        const [yearMonth, value] = entry.split('=');
        acc[yearMonth] = parseFloat(value);
        return acc;
      }, {});

      return res.status(201).json({
        message: `Statistiques des données d'utilisation (code: ${code}) pour le device_id: ${device_id}`,
        data: {
          result: resultFormatted,
          success: response.data.success,
          t: response.data.t,
          tid: response.data.tid
        }
      });
    } else {
      return res.status(400).json({ message: response.data.msg });
    }

  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la récupération du token",
      error: error.message
    });
  }
};


export async function functionGetStatisticsKitTongou (device_id, code, start_time, end_time, stat_type, time_type) {
  try {
    if (!device_id || !code || !stat_type || !start_time || !end_time) {
      return res.status(400).json({ message: "Les champs 'device_id', 'code', 'stat_type', 'start_time' et 'end_time' sont obligatoires." });
    }

    let isValid = false;
    let response = {};
    let retries = 0;

    while (!isValid && retries < 3) {
      let tokens = getTokens();

      // Vérifier si le token est manquant ou invalide
      if (tokens.accessToken === null || response?.data?.msg === "token invalid") {
        
        try {
          await axios.get(`${port_ecozipo}/gettokentongou`);
          tokens = getTokens();
          
        } catch (error) {
          return res
            .status(500)
            .json({ messageError: "Vous êtes hors ligne, veuillez vérifier votre connexion!" });
        }
      }
      // console.log("start_time eto : ",start_time)
      // console.log("end_time  eto : ",end_time)
      // console.log("time_type : ",time_type);
      
      
      const method = 'GET';
      const url = `/v1.0/cloud/energy/breaker/devices/${device_id}/statistics?user_id=${user_id}&code=${code}&start_time=${start_time}&end_time=${end_time}&stat_type=${stat_type}&time_type=${time_type}`;
      const access_token = getTokens().accessToken;
      const body = "";
      const generateSign = await GenerateSign(access_token, body, client_id, key_tongou, url, method);
  
      const headers = {
        'client_id': generateSign.sign_rep.client_id,
        'access_token': generateSign.sign_rep.access_token,
        'sign': generateSign.sign_rep.sign,
        't': generateSign.sign_rep.t,
        'sign_method': generateSign.sign_rep.sign_method,
      };

      try {
        response = await axios.get(`${end_point_ogemray}${url}`, { headers });
        
        // console.log("response : ",response.data.result);
        // console.log("----------------------------------");

        if (response.data.success) {
          isValid = true; 
        } else {
          console.error("Response error:", response.data.msg);
          retries++;
        }
      } catch (error) {
        console.error("Request error:", error.message);
        retries++;
      }
    }
    
    
    if (isValid) {
      const rawResult = response.data.result;
      const resultFormatted = rawResult.slice(1, -1).split(', ').reduce((acc, entry) => {
        const [yearMonth, value] = entry.split('=');
        acc[yearMonth] = parseFloat(value);
        
        return acc;
      }, {});
      return{
        message: `Statistiques des données d'utilisation (code: ${code}) pour le device_id: ${device_id}`,
        data: {
          result: resultFormatted,
          success: response.data.success,
          t: response.data.t,
          tid: response.data.tid
        }
      };
    } else {
      return res.status(400).json({ message: response.data.msg, success: false });
    }

  } catch (error) {
    return{
      message: error.message,
      success: false
    };
  }
};


// export async function functionGetStatisticsKitTongou (device_id, code, start_time, end_time, stat_type, time_type) {
//   try {
//     if (!device_id || !code || !stat_type || !start_time || !end_time) {
//       return res.status(400).json({ message: "Les champs 'device_id', 'code', 'stat_type', 'start_time' et 'end_time' sont obligatoires." });
//     }

//     let isValid = false;
//     let response = {};
//     let retries = 0;

//     while (!isValid && retries < 3) {
//       let tokens = getTokens();

//       // Vérifier si le token est manquant ou invalide
//       if (tokens.accessToken === null || response?.data?.msg === "token invalid") {
        
//         try {
//           await axios.get(`${port_ecozipo}/gettokentongou`);
//           tokens = getTokens();
          
//         } catch (error) {
//           return res
//             .status(500)
//             .json({ messageError: "Vous êtes hors ligne, veuillez vérifier votre connexion!" });
//         }
//       }
//       // console.log("start_time eto : ",start_time)
//       // console.log("end_time  eto : ",end_time)
      
//       const method = 'GET';
//       const url = `/v1.0/cloud/energy/breaker/devices/${device_id}/statistics?user_id=${user_id}&code=${code}&start_time=${start_time}&end_time=${end_time}&stat_type=${stat_type}&time_type=${time_type}`;
//       const access_token = getTokens().accessToken;
//       const body = "";
//       const generateSign = await GenerateSign(access_token, body, client_id, key_tongou, url, method);
  
//       const headers = {
//         'client_id': generateSign.sign_rep.client_id,
//         'access_token': generateSign.sign_rep.access_token,
//         'sign': generateSign.sign_rep.sign,
//         't': generateSign.sign_rep.t,
//         'sign_method': generateSign.sign_rep.sign_method,
//       };

//       try {
//         response = await axios.get(`${end_point_ogemray}${url}`, { headers });

//         if (response.data.success) {
//           isValid = true; 
//         } else {
//           console.error("Response error:", response.data.msg);
//           retries++;
//         }
//       } catch (error) {
//         console.error("Request error:", error.message);
//         retries++;
//       }
//     }

//     if (isValid) {
//       const rawResult = response.data.result;
//       const resultFormatted = rawResult.slice(1, -1).split(', ').reduce((acc, entry) => {
//         const [yearMonth, value] = entry.split('=');
//         acc[yearMonth] = parseFloat(value);
        
//         return acc;
//       }, {});
//       return{
//         message: `Statistiques des données d'utilisation (code: ${code}) pour le device_id: ${device_id}`,
//         data: {
//           result: resultFormatted,
//           success: response.data.success,
//           t: response.data.t,
//           tid: response.data.tid
//         }
//       };
//     } else {
//       return res.status(400).json({ message: response.data.msg, success: false });
//     }

//   } catch (error) {
//     return{
//       message: error.message,
//       success: false
//     };
//   }
// };


/***
 * 
 * FORMATED DATE
 */
function addHoursToUTC(date, hoursToAdd) {
  // Crée une nouvelle instance de la date pour éviter de modifier l'originale
  const newDate = new Date(date);

  // Ajoute les heures spécifiées
  newDate.setHours(newDate.getHours() + hoursToAdd);

  return newDate;
}


export function comparaisonDate() {
  const today = new Date();

 // Extraction des composants (heures, minutes, secondes)
 const utcHours = today.getUTCHours();
 const utcMinutes = today.getUTCMinutes();
 const utcSeconds = today.getUTCSeconds();

 const localHours = today.getHours();
 const localMinutes = today.getMinutes();
 const localSeconds = today.getSeconds();

 // Comparaison des composants
 const isSameTime =
   utcHours === localHours &&
   utcMinutes === localMinutes &&
   utcSeconds === localSeconds;

  return isSameTime;
}


export function getTodayDateFormatted() {
  let today = new Date();
  const isSameTime = comparaisonDate();
  
  
  if (isSameTime) {
    today = addHoursToUTC(today , 3);
    console.log("L'heure UTC est identique à l'heure locale donc +3 pour Madagascar.");
  } 
  // today = addHoursToUTC(today , 18);
  console.log("today", today);
  
  
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0'); // Mois de 0 à 11, donc ajout de +1
  const day = String(today.getDate()).padStart(2, '0');

  const hours = String(today.getHours()).padStart(2, '0');
  const minutes = String(today.getMinutes()).padStart(2, '0');
  const seconds = String(today.getSeconds()).padStart(2, '0');

  console.log(`Date and time : ${year}-${month}-${day} ${hours}:${minutes}:${seconds}`);
  
  return `${year}${month}${day}`;
}


export function getDateFormated(date) {
  try {
    const dateRegex = /^(0[1-9]|[12][0-9]|3[01])[-\/](0[1-9]|1[0-2])[-\/](\d{4})$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ message: "Format de date incorrect. Utilisez JJ/MM/AAAA ou JJ-MM-AAAA." });
    }

    const [day, month, year] = date.split(/[-\/]/);

    const isoDateString = `${year}-${month}-${day}`;
    const today = new Date(isoDateString);

    if (isNaN(today.getTime())) {
      return res.status(400).json({ message: "Date invalide." });
    }
    const formattedDate = `${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}`;
    return {date: formattedDate}
  } catch (error) {
    return { message: "Erreur lors de la récupération de la date", error: error.message };
  }
  
}


export const getDateFomatend = async (req, res) => {
  try {
    const date = req.body.date;

    const dateRegex = /^(0[1-9]|[12][0-9]|3[01])[-\/](0[1-9]|1[0-2])[-\/](\d{4})$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ message: "Format de date incorrect. Utilisez JJ/MM/AAAA ou JJ-MM-AAAA." });
    }

    const [day, month, year] = date.split(/[-\/]/);

    const isoDateString = `${year}-${month}-${day}`;
    const today = new Date(isoDateString);

    if (isNaN(today.getTime())) {
      return res.status(400).json({ message: "Date invalide." });
    }

    const formattedDate = `${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}`;
    res.json({ formattedDate });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération de la date", error: error.message });
  }
};






/***
 * 
 * ON & OFF KIT
 */
export const controlKit = async (req, res) => {
  try {
    const { device_id, value } = req.body;
    let isValid = false;
    let response = {};
    let retries = 0; 

    if (!device_id || !code) {
      return res.status(400).json({ message: "Les champs 'device_id' et 'value' sont obligatoires." });
    }

    while (!isValid && retries < 3) {
      let tokens = getTokens();

      // Vérifier si le token est manquant ou invalide
      if (tokens.accessToken === null || response?.data?.msg === "token invalid") {
        
        try {
          await axios.get(`${port_ecozipo}/gettokentongou`);
          tokens = getTokens();
          
        } catch (error) {
          return res
            .status(500)
            .json({ messageError: "Vous êtes hors ligne, veuillez vérifier votre connexion!" });
        }
      }

      const method = 'POST';
      const url = `/v1.0/cloud/energy/micro/device/command/${device_id}?user_id=${user_id}&code=switch&value=${value}`;
      const access_token = getTokens().accessToken;
      const body = "";
      const generateSign = await GenerateSign(access_token, body, client_id, key_tongou, url, method);

      const headers = {
        'client_id': generateSign.sign_rep.client_id,
        'access_token': generateSign.sign_rep.access_token,
        'sign': generateSign.sign_rep.sign,
        't': generateSign.sign_rep.t,
        'sign_method': generateSign.sign_rep.sign_method,
      };


      try {
        response = await axios.post(`${end_point_ogemray}${url}`, null, {
          headers: headers,
        });

        // console.log("response.data : ",response.data);
        

        if (response.data.success) {
          isValid = true; 
        } else {
          console.error("Response error:", response.data.msg);
          retries++;
        }
      } catch (error) {
        console.error("Request error:", error.message);
        retries++;
      }
    }  
    
    // console.log("value : ",value);
    
    if (isValid) {

       // find KitTongou
       const kitTongou = await prisma.kitTongou.findFirst({
        where: {
          idKitTongou: device_id,
        },
      });
      let pseudoKit = kitTongou.pseudo

      let message;
      if (response.data.success && !response.data.result) message = `Votre kit ${pseudoKit} est hors ligne. Vous ne pouvez pas ${value === "true" ? "allumer" : "éteindre"} le kit.`;
      else if (value === "true") {
        message = `Votre kit ${pseudoKit} est allumé.`;
        // update kitOnOff
        await prisma.kitTongou.update({
          where: {
            id: kitTongou.id
          },
          data: {
            kitOnOff: true
          }
        });
      }
      else {
        message = `Votre kit ${pseudoKit} est éteint.`;
        // update kitOnOff
        await prisma.kitTongou.update({
          where: {
            id: kitTongou.id
          },
          data: {
            kitOnOff: false
          }
        });
      }

     

      // find KitTongouUser by kitTongouId
      const kitTongouUser = await prisma.kitTongouUser.findFirst({
        where: {
          kitTongouId: kitTongou.id,
        },
      });

      let utilisateurId = kitTongouUser.utilisateurId
      let kitTongouId = kitTongou.id

      // console.log("message : ",message);
      // console.log("type : ","S");
      // console.log("utilisateurId : ",utilisateurId);
      // console.log("kitTongouId : ",kitTongouId);
      // console.log("value : ",value);
      
      // socket
      req.io.emit('notifControlKit', {
        message: message,
        type: "alerte",
        utilisateurId : utilisateurId,
        kitTongouId: kitTongouId,
      });


      // push notification
      // await prisma.notification.create({
      //   data:{
      //       message: message,
      //       type: "alerte",
      //       utilisateurId : utilisateurId,
      //       kitTongouId: kitTongouId
      // }})

      

      return res.status(201).json({
        message: message,
        data: response.data,
        succes: true
      });

    } else {
      return res.status(400).json({ message: response.data.msg, succes: false });
    }

  

  } catch (error) {
    res.status(500).json({
      message: error.message,
      succes: false 
    });
  }
};




/***
 * 
 * get total usage
 */
export const getTotalUsageKitTongou = async (req, res) => {
  try {
    const { device_id } = req.body;
    let isValid = false;
    let response = {};
    let retries = 0; 

    if (!device_id) {
      return res.status(400).json({ message: "Le champs 'device_id'est obligatoire.", success: false });
    }

    while (!isValid && retries < 3) {
      let tokens = getTokens();

      // Vérifier si le token est manquant ou invalide
      if (tokens.accessToken === null || response?.data?.msg === "token invalid") {
        
        try {
          await axios.get(`${port_ecozipo}/gettokentongou`);
          tokens = getTokens();
          
        } catch (error) {
          return res
            .status(500)
            .json({ message: error.message, success: false });
        }
      }
      
      const method = 'GET';
      const url = `/v1.0/cloud/energy/breaker/devices/${device_id}/statistics/total?user_id=${user_id}&code=add_ele&stat_type=sum`;
      const access_token = getTokens().accessToken;
      const body = "";
      const generateSign = await GenerateSign(access_token, body, client_id, key_tongou, url, method);

      const headers = {
        'client_id': generateSign.sign_rep.client_id,
        'access_token': generateSign.sign_rep.access_token,
        'sign': generateSign.sign_rep.sign,
        't': generateSign.sign_rep.t,
        'sign_method': generateSign.sign_rep.sign_method,
      };
      


      try {
        response = await axios.get(`${end_point_ogemray}${url}`, {
          headers: headers,
        });
        

        if (response.data.success) {
          isValid = true; 
        } else {
          console.error("Response error:", response.data.msg);
          retries++;
        }
      } catch (error) {
        console.error("Request error:", error.message);
        retries++;
      }
    }  
    
    // console.log("value : ",value);
    
    if (isValid) {
      return res.status(201).json({
        message: "the total usage of the specified device",
        data: response.data,
        succes: true
      });

    } else {
      return res.status(400).json({ message: response.data.msg, succes: false });
    }

  

  } catch (error) {
    res.status(500).json({
      message: error.message,
      succes: false 
    });
  }
};





/**
 * BLOCKED KIT
 */
export const blockedKit = async (req, res) => {
  try {
    const { idKitTongou, blocked } = req.body;

    if (!idKitTongou) {
      return res.status(400).json({ message: "Le champs 'idKitTongou' est obligatoire.", success: false });
    }

    const getKitTongou = await prisma.kitTongou.findFirst({
      where: {
        idKitTongou: idKitTongou,
      },
    });
    if(!getKitTongou) return res.status(404).json({ message: "Ce kit n'existe pas", success: false })

    /**
     * eteindre kit
     */
    let value = "false"
    if(blocked) value = "false"
    else value = "true"
        
    await axios.post(`${port_ecozipo}/controlkittongou`, {device_id: idKitTongou, value: value});
    

    /**
     * blocked kit
     */
    let message = ""
    if(blocked){
      message = `Le kit ${getKitTongou.idKitTongou} est maintenant bloqué.`
    }else{
      message = `Le kit ${getKitTongou.idKitTongou} est maintenant débloqué.`
    }

    const updatekitTongou = await prisma.kitTongou.update({
      where: {
        id: getKitTongou.id
      },
      data: {
          blocked : blocked,
      }
    });

    


    return res.status(201).json({
      message: message,
      data: updatekitTongou,
      success: true
    });


  } catch (error) {
    res.status(500).json({
      message: error.message,
      success: false
    });
  }
};

export async function functionBlockedKit () {
  try {

    // get all kitTongouEcozipo
    const kitTongouEcozipo = await prisma.kitTongou.findMany({
      where: {
        blocked: true
      }
    });

    for (let index = 0; index < kitTongouEcozipo.length; index++) {
      let device_id = kitTongouEcozipo[index].idKitTongou
      let value = "false"
      await axios.post(`${port_ecozipo}/controlkittongou`, {device_id: device_id, value: value});
      
    }
    
    let message = "Aucun kit bloqué"
    if(kitTongouEcozipo.length > 0) message = `Il y a ${kitTongouEcozipo.length} kit bloqué`
    
    console.log("message : ",message)
    

  } catch (error) {
    console.error("message : ",error.message);
  }
};






/***
 * SEE IF KIT IS OFFLINE
 */
export async function functionSeeKitOffline (device_id) {
  try {
    let kitTongou = {}

    // find kitTOngou
    kitTongou = await prisma.kitTongou.findFirst({
      where: {
        idKitTongou: device_id,
      },
    });
    if(!kitTongou) return res.status(404).json({ message: "Ce kit n'existe pas", success: false })

    // get online status
    let online = kitTongou.online
    let message = `Votre kit ${kitTongou.pseudo} est en ligne`
    let dateHorsLigne = null
    let differenceDate = null

    if(online === false && kitTongou.dateOffline === null) {
      message = `Votre kit ${kitTongou.pseudo} est hors ligne`
      // update dateOffline in datetime now
      await prisma.kitTongou.update({
        where: {
          id: kitTongou.id
        },
        data: {
          dateOffline: new Date()
        }
      });
    }else if(online === true){
      await prisma.kitTongou.update({
        where: {
          id: kitTongou.id
        },
        data: {
          dateOffline: null
        }
      });
    }

    if(kitTongou.dateOffline !== null){
      kitTongou = await prisma.kitTongou.findFirst({
        where: {
          idKitTongou: device_id,
        },
      });
      dateHorsLigne = kitTongou.dateOffline

      // const dateHorsLigne2 = dayjs(dateHorsLigne);
      // const dateNow2 = dayjs(new Date());

      // const diffEnMs = dateNow2.diff(dateHorsLigne2); // Différence en millisecondes
      // differenceDate = dayjs.duration(diffEnMs);

      // console.log("dateHorsLigne : ",dateHorsLigne);
      
      // // si plus de 30min
      // if (differenceDate.asMinutes() > 30) {
      //   message = "Kit est hors ligne depuis plus de 30min";
      // } 
    }
    
      
    return{
      message: message,
      data: {
        dateHorsLigne: dateHorsLigne,
        dateNow: new Date(),
        differenceDate: differenceDate
      }
    };
  } catch (error) {
    return{
      message: error.message,
      success: false
    };
  }
};


export async function seeKitOfflineinDynamicTime(addTime, timeUnit, io) {
  // timeUnit : hour, minute, day

  // get all kittongou
  const kitTongou = await prisma.kitTongou.findMany({
    where: {
      AND: [
        { status: true },
        { dateOffline: { not: null } }
      ]
    }
  });

  for (let index = 0; index < kitTongou.length; index++) {
    let dateHorsLigneKit = kitTongou[index].dateOffline;
    let dateHorsLigne = dayjs(dateHorsLigneKit);
    // console.log("dateHorsLigne : ", dateHorsLigne);

    let currentTime = dayjs();
    let timeToWait;

    // find kitTongouUser by kitTongouId
    const kitTongouUser = await prisma.kitTongouUser.findFirst({
      where: {
        kitTongouId: kitTongou.id
      }
    });

    // Appliquer le délai dynamique en fonction de l'unité
    if (timeUnit === 'hour') {
      timeToWait = dateHorsLigne.add(addTime, 'hour');
    } else if (timeUnit === 'minute') {
      timeToWait = dateHorsLigne.add(addTime, 'minute');
    } else if (timeUnit === 'day') {
      timeToWait = dateHorsLigne.add(addTime, 'day');
    } else {
      console.error('Unité de temps inconnue');
      return;
    }

    // console.log("timeToWait : ", timeToWait);

    // console.log("--------------------------------");
    
    // Si l'heure de déclenchement est déjà passée, on planifie pour le lendemain
    if (timeToWait.isBefore(currentTime)) {
      console.error(`La date de déclenchement hors ligne du kit (${kitTongou[index].idKitTongou}) est déjà passée. Replanification...`);
      timeToWait = timeToWait.add(1, 'day'); 
    }

    let delayInMs = timeToWait.diff(currentTime); 

    // Planifier la tâche avec setTimeout
    setTimeout(async () => {
      console.log('Déclenchement de la notification maintenant');
      
      if(addTime === 2){
        io.emit('notifKitHorsLigne', {
          message: `Dispositif ${kitTongou[index].pseudo} hors ligne`,
          type: "alerte",
          utilisateurId : kitTongouUser.utilisateurId,
          kitTongouId: kitTongou[index].id
        });
  
        // await prisma.notification.create({
        //   data:{
        //       message: `Dispositif ${kitTongou[index].pseudo} hors ligne`,
        //       type: "alerte",
        //       utilisateurId : kitTongouUser.utilisateurId,
        //       kitTongouId: kitTongou[index].id
        // }})  
  
      }else{
        let data = {
          pseudo: kitTongou[index].pseudo,
          timeUnit: timeUnit,
          addTime: addTime
        }
        const reponseIA = await kitTongouHorsLigneIA(data)  
        console.log("reponseIA : ",reponseIA);
  
        io.emit('notifKitHorsLigne', {
          message: reponseIA.message,
          type: "alerte",
          utilisateurId : kitTongouUser.utilisateurId,
          kitTongouId: kitTongou[index].id
        });
  
        // await prisma.notification.create({
        //   data:{
        //       message: reponseIA.message,
        //       type: "alerte",
        //       utilisateurId : kitTongouUser.utilisateurId,
        //       kitTongouId: kitTongou[index].id
        // }})  
  
      }
      
    }, delayInMs);
  }
}

