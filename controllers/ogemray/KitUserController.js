import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv';
import jwt from "jsonwebtoken";
import axios from 'axios'
import { CalculEletriciteKit, CalculTKwhEnAriaryTTC, CalculTroisDernierFacture } from '../JiramaCalculController.js';
import { decodeTimeFunction, encodeTimeFunction } from '../ConfigController.js';
import { ReponseIAKit } from '../ChatController.js';
import axiosRetry from 'axios-retry'
import cron from 'node-cron';
import { ReponseIACreateKitUser } from '../Tongou/KitTongouIAController.js';

config();

const prisma = new PrismaClient()
const portAppareil = process.env.PORT_APPAREIL
const API_KIT = process.env.API_KIT;
const port_ecozipo = process.env.PORT_ECOZIPO;
let cachedToken = null;
let tokenExpiration = null;
axiosRetry(axios, { retries: 3 });

/**
 * UPDATE TRANCHE KIT
 */
export const updateTrancheKit = async(req, res) =>{
  try {
      const utilisateurId = req.body.utilisateurId;
      const tranche = req.body.tranche;

      let response = await prisma.userAppareil.findMany({
          where:{
              utilisateurId : parseInt(utilisateurId)
          },
          include:{
              Kit: true,
              Utilisateur: true
          }
      })
      
      if(response.length === 0) return res.status(200).json({
        message: "Aucun appareil trouvé",
        data: response
      })

     

      for (let index = 0; index < response.length; index++) {
          let data = {}
          let idKit = response[index].Kit.id
          let DID = response[index].Kit.DID
         
          try {
            data = await axios.post(`${port_ecozipo}/getkitstatusquery`, {DID : DID});
            let kWhTotal = data.data.Data.Data.kWhTotal
            let prixTotal = data.data.Data.Data.prixTotal
            response[index].Kit.kWhTotal = kWhTotal 
            response[index].Kit.prixTotal = prixTotal
            
            // if(parseInt(tranche) === 1){
            //   await prisma.kit.update({
            //       where: {
            //           id: parseInt(idKit),
            //       },
            //       data: {
            //           t1: parseFloat(kWhTotal)
            //       },
            //   });
            // }
          } catch (error) {
            console.error("Erreur du connexion")
          }
         
      }

     
     
      res.json({
          Msg : "Les tranches du kits sont tous mise à jour",
          TotalCount: response.length,
          Data : response
      })
     
    } catch (error) {
      res.status(500).json({ messageError: 'Erreur serveur' });
    }
}


/**
 * GET KIT BY DID
 */
export const getKitByDID = async(req, res) =>{
  try {
      const DID = req.body.DID;

      let response = await prisma.kit.findFirst({
          where:{
            DID : parseInt(DID)
          },
          include:{
              KitType: true
          }
      })
      
      if(response.length === 0) return res.status(200).json({
        message: "Aucun appareil trouvé",
        data: response
      })

      let data = {}
     
      try {
        data = await axios.post(`${port_ecozipo}/getkitstatusquery`, {DID : DID});
        let kWhTotal = data.data.Data.Data.kWhTotal
        let prixTotal = data.data.Data.Data.prixTotal
        response.kWhTotal = kWhTotal 
        response.prixTotal = prixTotal 
      } catch (error) {
        console.error("Erreur du connexion")
      }
     
     
      res.json({
          Msg : "Votre kit",
          TotalCount: response.length,
          Data : response
      })
     
    } catch (error) {
      res.status(500).json({ messageError: 'Erreur serveur' });
    }
}


/**
 * GET KIT BY USER
 */
export const getKitByUser = async(req, res) =>{
  try {
      const token = req.body.token;

      if (!token) return res.json({ messageError: 'Token manquant, veuillez reconnecter' });
          
      const decodedToken = jwt.decode(token);  
      if (!decodedToken || !decodedToken.user) return res.json({ messageError: 'Token invalide' });
      
      const utilisateurId= decodedToken.user;

      let response = await prisma.userAppareil.findMany({
          where:{
              utilisateurId : parseInt(utilisateurId)
          },
          include:{
              Kit: true,
              Utilisateur: true
          }
      })
      
      if(response.length === 0) return res.status(200).json({
        message: "Aucun appareil trouvé",
        data: response
      })


      for (let index = 0; index < response.length; index++) {
          let data = {}
          let DID = response[index].Kit.DID
         
          try {
            data = await axios.post(`${port_ecozipo}/getkitstatusquery`, {DID : DID});
            let kWhTotal = data.data.Data.Data.kWhTotal
            let prixTotal = data.data.Data.Data.prixTotal

            // afficher les valeurs avec Kit
            response[index].Kit.kWhTotal = kWhTotal 
            response[index].Kit.prixTotal = prixTotal 

          } catch (error) {
            console.error("Erreur du connexion")
          }
          
      }


      // const ControlCode = "SwitchStatusQuery";
      // const apiUrl = `${API_KIT}/api/device/controls`;
      // const gettoken = await axios.get(`${port_ecozipo}/gettokenbykit`);
      // let tokenApp = gettoken.data.token;

      // await prisma.kit.update({
      //   where: { id: kitExit.id },
      //   data: {
      //     kitStatus : true
      //   }
      // });
      
      // for (let index = 0; index < response.length; index++) {
      //   let DID = response[index].Kit.DID

      //   let controlData = {
      //     Token: tokenApp,
      //     DID: DID,
      //     ControlCode: ControlCode,
      //     ControlParam: null,
      //   };
    
      //   let response2 = await axios.post(apiUrl, controlData, {
      //     headers: {
      //       'Content-Type': 'application/json',
      //     },
      //   });
      //   let switchArray = response2.data.Data.SwitchArray;
      //   let status = switchArray[0]
        

      //   let kitExit = await prisma.kit.findFirst({
      //     where: {
      //         DID: parseInt(DID)
      //     },
      //   });


      //   if(parseInt(status) === 0) {
      //     await prisma.kit.update({
      //       where: { id: kitExit.id },
      //       data: {
      //         kitStatus : false
      //       }
      //     });
          
      //   }else if(status === 1){
      //     await prisma.kit.update({
      //       where: { id: kitExit.id },
      //       data: {
      //         kitStatus : true
      //       }
      //     });
      //   }
      // }
     
     
      res.json({
          Msg : "Vos kits",
          TotalCount: response.length,
          Data : response
      })
     
    } catch (error) {
      res.status(500).json({ messageError: 'Erreur serveur' });
    }
}




/**
 * GET KIT STATUS (POWER, VOLTAGE, ELECTRON) 
 **/ 
export const getKitStatusQuery = async(req, res) => {
  try {
    const DID = req.body.DID;
    const currentDate = new Date(); 

    // MOIS ACTUELLE
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    // Date actuelle 00:01 à 23:59  
    const startOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 1);
    const endOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59);

    
    // Check if the token exists and if it's still valid
    if (!cachedToken || tokenExpiration <= Date.now()) {
      // Fetch a new token if it doesn't exist or has expired
      const gettoken = await axios.get(`${port_ecozipo}/gettokenbykit`);
      cachedToken = gettoken.data.token;

      // Set the token expiration to 2 hours from now (2 * 60 * 60 * 1000 ms)
      tokenExpiration = Date.now() + (2 * 60 * 60 * 1000);
    }

    const token = cachedToken;


    const ControlCode = "SwitchStatusQuery";

    const kitExit = await prisma.kit.findFirst({
      where: {
        DID: parseInt(DID),
      },
    });
    if (!kitExit) return res.status(404).json({ messageError: "Kit introuvable!" });
    
    // GET USER APPAREIL
    const userAppareil = await prisma.userAppareil.findFirst({
      where: {
        kitId: kitExit.id,
      },
    });
    if (!userAppareil) return res.status(404).json({ messageError: "Cette kit n'est pas disponible!" });

    

    const controlData = {
      Token: token,
      DID: parseInt(DID),
      ControlCode: ControlCode,
      ControlParam: null,
    };

    const apiUrl = `${API_KIT}/api/device/controls`;

    

    let response = {}
    try {
      response = await axios.post(apiUrl, controlData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    } catch (error) {
        return res.status(500).json({ messageError: "Vous êtez hors ligne, Veuillez vérifier votre connexion!" });
    }


    // update status power kit
    try {
      let KitOnorOff = response.data.Data.SwitchArray[0]
      let kitStatus = false
      if(KitOnorOff === 0) kitStatus = false
      else kitStatus = true
      await prisma.kit.update({
        where: { id: kitExit.id },
        data: {
          kitStatus : kitStatus
        },
      });
    } catch (error) {
        return res.status(500).json({ messageError: "Vous êtez hors ligne, Veuillez vérifier votre connexion!" });
    }

    
    // GET VALEUR BY DAY
    let ValeurJour = {}
    try {
      ValeurJour = await axios.post(`${port_ecozipo}/getkitconsommationbyperiod`, {DID : DID, startTime : startOfDay.toString(), endTime : endOfDay.toString()});
      
    } catch (error) {
        return res.status(500).json({ messageError: "Vous êtez hors ligne, Veuillez vérifier votre connexion!" });
    }

    let kWhJour = ValeurJour.data.Data.Data.kWh
    response.data.Data.kWhJour = parseFloat(kWhJour.toFixed(6));

    // Notification par IA
    let prixJour = await CalculTKwhEnAriaryTTC(userAppareil.compteElectriciteEauId, kWhJour)
    if (prixJour.messageError) return res.status(400).json({ messageError: resultElectricite.messageError }); 

    let consommationJour = kitExit.consommationJour
    let tranche1 = consommationJour / 1.25
    let tranche2 = consommationJour
    let tranche3 = consommationJour * 1.25
    let prixParJour = prixJour.data.prixTTC
    

    console.log("consommationJour : ",consommationJour,"kWh")
    console.log("tranche1 : ",tranche1,"kWh")
    console.log("tranche2 : ",tranche2,"kWh")
    console.log("tranche3 : ",tranche3,"kWh")
    console.log("kWhJour : ",kWhJour,"kWh") 
    console.log("prixJour TTC : ",prixParJour,"Ar");
    // console.log("prixJour : ",prixJour,"kWh") 
    

    const kitNotifStatus = await prisma.kitNotifStatus.findFirst({
      where: {
        kitId: kitExit.id
      }
    })

    // calcul consommation par heure
    let calculConsommationHeure = await notifJourHeure(consommationJour, kWhJour, kitNotifStatus.id, parseInt(userAppareil.utilisateurId))
    if (calculConsommationHeure.messageError) return res.status(400).json({ messageError: resultElectricite.messageError });  
   

    if(kWhJour > tranche3){
      if(kitNotifStatus.status3 === false){
        let data = {
          seuil: 3,
          consommationJour: consommationJour,
          kWhJour: kWhJour,
          prixParJour:prixParJour
        }
        let analyseIA = await ReponseIAKit(data)
        if (analyseIA.messageError) return res.status(400).json({ messageError: resultElectricite.messageError });  
        console.log("analyseIA.message : ",analyseIA.message)
        await prisma.kitNotifStatus.update({
          where: {
            id: kitNotifStatus.id
          },
          data: {
            status1: true,
            status2: true,
            status3: true
          }
        })
        const newNotif = await prisma.notification.create({
          data:{
              message: analyseIA.message,
              type: "IA",
              utilisateurId : parseInt(userAppareil.utilisateurId)
        }})
        req.io.emit('notifLimiteKit', newNotif);
      }
    }
    else if(kWhJour === tranche2){
      if(kitNotifStatus.status2 === false){
        let data = {
          seuil: 2,
          consommationJour: consommationJour,
          kWhJour: kWhJour,
          prixParJour:prixParJour
        }
        let analyseIA = await ReponseIAKit(data)
        if (analyseIA.messageError) return res.status(400).json({ messageError: resultElectricite.messageError });  
        console.log("analyseIA.message : ",analyseIA.message)
        await prisma.kitNotifStatus.update({
          where: {
            id: kitNotifStatus.id
          },
          data: {
            status1: true,
            status2: true
          }
        })
        const newNotif = await prisma.notification.create({
          data:{
              message: analyseIA.message,
              type: "IA",
              utilisateurId : parseInt(userAppareil.utilisateurId)
        }})
        req.io.emit('notifLimiteKit', newNotif);
      }
    }
    else if(kWhJour > tranche1){
      if(kitNotifStatus.status1 === false){
        let data = {
          seuil: 1,
          consommationJour: consommationJour,
          kWhJour: kWhJour,
          prixParJour:prixParJour
        }
        let analyseIA = await ReponseIAKit(data)
        if (analyseIA.messageError) return res.status(400).json({ messageError: resultElectricite.messageError });  
        console.log("analyseIA.message : ",analyseIA.message)
        await prisma.kitNotifStatus.update({
          where: {
            id: kitNotifStatus.id
          },
          data: {
            status1: true
          }
        })
        const newNotif = await prisma.notification.create({
          data:{
              message: analyseIA.message,
              type: "IA",
              utilisateurId : parseInt(userAppareil.utilisateurId)
        }})
        req.io.emit('notifLimiteKit', newNotif);
      }
    }
    
    
    // console.log("startOfDay.toString() : ",startOfDay.toString(), " |endOfDay.toString() : ",endOfDay.toString());
    // console.log("firstDayOfMonth.toLocaleDateString() : ",firstDayOfMonth.toLocaleDateString(), " | lastDayOfMonth.toLocaleDateString() : ",lastDayOfMonth.toLocaleDateString());

    
    // GET VALEUR BY MOIS
    let ValeurMois = {}

    console.log("firstDayOfMonth.toLocaleDateString() : ",firstDayOfMonth.toLocaleDateString())
    console.log("lastDayOfMonth.toLocaleDateString() : ",lastDayOfMonth.toLocaleDateString());
    try {
      ValeurMois = await axios.post(`${port_ecozipo}/getkitconsommationbyperiod`, {DID : DID, startTime : firstDayOfMonth.toLocaleDateString(), endTime : lastDayOfMonth.toLocaleDateString()});
      
    } catch (error) {
        return res.status(500).json({ messageError: "Vous êtez hors ligne, Veuillez vérifier votre connexion!" });
    }
    let kWhTotal = ValeurMois.data.Data.Data.kWh
    response.data.Data.kWhTotal = parseFloat(kWhTotal.toFixed(6));


    // Convertir les milliwatts en kilowatts
    let powerMilliwatt = response.data.Data.Power 
    let powerWatt = powerMilliwatt / 1000
    let powerkilowatt = powerMilliwatt / 1000000
    response.data.Data.Power = powerkilowatt
   
    // kWh
    let kWh = (response.data.Data.Power * 1)
    response.data.Data.kWh = parseFloat(kWh);

    // kWh total

    

    
    const compteElectricite = await prisma.compteElectriciteEau.findUnique({
      where:{
        id : userAppareil.compteElectriciteEauId
      },
      include: {
          Utilisateur: true
      },
    })
    if (!compteElectricite) return res.json({ messageError: "Vous n'avez pas du compte électricité!" });
    let tourneId = compteElectricite.referenceClient
    let communeId = compteElectricite.communeClient.toString()
    let tarif = compteElectricite.tarif
    let puissance = compteElectricite.puissance
    let type = compteElectricite.categorie
    let kitId = kitExit.id
    let utilisateurId = compteElectricite.utilisateurId
   
    // prix consommation
    const resultElectricite = await CalculEletriciteKit(tourneId, communeId, tarif, kWh, puissance, type, kitId, utilisateurId);
    if (resultElectricite.messageError)  return res.status(400).json({ messageError: resultElectricite.messageError });

  
    if(kitExit.kitTypeId === 1){
      response.data.Data.prix = parseFloat(resultElectricite.facture.prix_net.toFixed(6))
    }else{
      response.data.Data.prix = parseFloat(resultElectricite.facture.prixKwh.toFixed(6))
    }
    // response.data.Data.prix = parseFloat(resultElectricite.facture.prixKwh.toFixed(6))

    // prix total
    const resultElectricite2 = await CalculEletriciteKit(tourneId, communeId, tarif, kWhTotal, puissance, type, kitId, utilisateurId);
    // console.log("DID : ",DID, " || resultElectricite2.facture : ",resultElectricite2.facture )
    if (resultElectricite2.messageError)  return res.status(400).json({ messageError: resultElectricite.messageError });
    if(kitExit.kitTypeId === 1){
      response.data.Data.prixTotal = parseFloat(resultElectricite2.facture.prix_net.toFixed(6))
    }else{
      response.data.Data.prixTotal = parseFloat(resultElectricite2.facture.prixKwh.toFixed(6))
    }
    // response.data.Data.prixTotal = parseFloat(resultElectricite2.facture.prixKwh.toFixed(6))


    

    
    // Met en cache la donnée et l'horodatage
    // cache[cacheKey] = {
    //   timestamp: Date.now(),
    //   data: response.data,
    // };

    res.json({
      Msg: null,
      Data: response.data,
    });
  } catch (error) {
    return res.status(500).json({ messageError: "Vous êtez hors ligne, Veuillez vérifier votre connexion!" });
  }
};
export async function notifJourHeure(LimiteJour, consommationJour, idkitNotifStatus, utilisateurId) {
  try {
    let d1 = 0, d2 = 0, d3 = 0, d4 = 0;

   
    const date = new Date();
    const dayOfWeek = date.getDay(); 


    const joursFeries = ["01-01", "05-01", "12-25"]; // Exemple: 1er janvier, 1er mai, 25 décembre
    const today = `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;



    if (joursFeries.includes(today)) {
      // Cas des jours fériés
      d1 = parseFloat((LimiteJour * 0.02).toFixed(2));
      d2 = parseFloat((LimiteJour * 0.2).toFixed(2));
      d3 = parseFloat((LimiteJour * 0.38).toFixed(2));
      d4 = parseFloat((LimiteJour * 0.4).toFixed(2));
    } else if (dayOfWeek >= 1 && dayOfWeek <= 5) { 
      // Cas de lundi à vendredi
      d1 = parseFloat((LimiteJour * 0.01).toFixed(2));
      d2 = parseFloat((LimiteJour * 0.3).toFixed(2));
      d3 = parseFloat((LimiteJour * 0.19).toFixed(2));
      d4 = parseFloat((LimiteJour * 0.5).toFixed(2));
    } else {
      // Cas du weekend (samedi et dimanche)
      d1 = parseFloat((LimiteJour * 0.03).toFixed(2));
      d2 = parseFloat((LimiteJour * 0.2).toFixed(2));
      d3 = parseFloat((LimiteJour * 0.27).toFixed(2));
      d4 = parseFloat((LimiteJour * 0.5).toFixed(2));
    }

    console.log("00h00 à 04h00 : ",d1,"kWh");
    console.log("04h01 à 8h00",d2,"kWh");
    console.log("8h01 à 16h00",d3,"kWh");
    console.log("16h01 à 23h59",d4,"kWh"); 

    const kitNotifStatus = await prisma.kitNotifStatus.findUnique({
      where: {
        id: parseInt(idkitNotifStatus)
      }
    })
    let validd1 = kitNotifStatus.d1
    let validd2 = kitNotifStatus.d2
    let validd3 = kitNotifStatus.d3
    let validd4 = kitNotifStatus.d4
    let Msg = ""
  

    if(consommationJour > d1 && validd1 == false){
      Msg = `La consommation a dépassé la limite de ${d1}kWh avant 4h00 !`
      console.log(`La consommation a dépassé la limite de ${d1}kWh avant 4h00 !`)
      await prisma.kitNotifStatus.update({
        where: {
          id: parseInt(idkitNotifStatus)
        },
        data: {
          d1: true
        }
      })
      const newNotif = await prisma.notification.create({
        data:{
            message: Msg,
            type: "IA",
            utilisateurId : parseInt(utilisateurId)
      }})
      req.io.emit('notifLimiteKit', newNotif);
    }else{
      cron.schedule('0 4 * * *', async() => {
        console.log(`Félicitation, votre consommation n'a pas dépassé la limite de ${d1}kWh avant 4h00 !`);   
        Msg = `Félicitation, votre consommation n'a pas dépassé la limite de ${d1}kWh avant 4h00 !`
        await prisma.kitNotifStatus.update({
          where: {
            id: parseInt(idkitNotifStatus)
          },
          data: {
            d1: true
          }
        })
        const newNotif = await prisma.notification.create({
          data:{
              message: Msg,
              type: "IA",
              utilisateurId : parseInt(utilisateurId)
        }})
        req.io.emit('notifLimiteKit', newNotif);
        });
    }
    
    if(consommationJour > d2 && validd2 == false){
      console.log(`La consommation a dépassé la limite de ${d2}kWh avant 8h00 !`);
      Msg = `La consommation a dépassé la limite de ${d2}kWh avant 8h00 !`
      await prisma.kitNotifStatus.update({
        where: {
          id: parseInt(idkitNotifStatus)
        },
        data: {
          d2: true
        }
      })
      const newNotif = await prisma.notification.create({
        data:{
            message: Msg,
            type: "IA",
            utilisateurId : parseInt(utilisateurId)
      }})
      req.io.emit('notifLimiteKit', newNotif);
    }else{
      cron.schedule('0 8 * * *', async() => {
        console.log(`Félicitation, votre consommation n'a pas dépassé la limite de ${d2}kWh avant 8h00 !`);   
        Msg = `Félicitation, votre consommation n'a pas dépassé la limite de ${d2}kWh avant 8h00 !`
        await prisma.kitNotifStatus.update({
          where: {
            id: parseInt(idkitNotifStatus)
          },
          data: {
            d2: true
          }
        })
        const newNotif = await prisma.notification.create({
          data:{
              message: Msg,
              type: "IA",
              utilisateurId : parseInt(utilisateurId)
        }})
        req.io.emit('notifLimiteKit', newNotif);
      });
    }
   
    if(consommationJour > d3 && validd3 == false){
      console.log(`La consommation a dépassé la limite de ${d3}kWh avant 16h00 !`);
      Msg = `La consommation a dépassé la limite de ${d3}kWh avant 16h00 !`
      await prisma.kitNotifStatus.update({
        where: {
          id: parseInt(idkitNotifStatus)
        },
        data: {
          d3: true
        }
      })
      const newNotif = await prisma.notification.create({
        data:{
            message: Msg,
            type: "IA",
            utilisateurId : parseInt(utilisateurId)
      }})
      req.io.emit('notifLimiteKit', newNotif);
    }else{
      cron.schedule('0 16 * * *', async() => {
        console.log(`Félicitation, votre consommation n'a pas dépassé la limite de ${d3}kWh avant 16h00 !`);   
        Msg = `Félicitation, votre consommation n'a pas dépassé la limite de ${d3}kWh avant 16h00 !`
        await prisma.kitNotifStatus.update({
          where: {
            id: parseInt(idkitNotifStatus)
          },
          data: {
            d3: true
          }
        })
        const newNotif = await prisma.notification.create({
          data:{
              message: Msg,
              type: "IA",
              utilisateurId : parseInt(utilisateurId)
        }})
        req.io.emit('notifLimiteKit', newNotif);
      });
    }
    
    if(consommationJour > d4 && validd4 == false){
      console.log(`La consommation a dépassé la limite de ${d4}kWh avant 23h59 !`);
      Msg = `La consommation a dépassé la limite de ${d4}kWh avant 23h59 !`
      await prisma.kitNotifStatus.update({
        where: {
          id: parseInt(idkitNotifStatus)
        },
        data: {
          d4: true
        }
      })
      const newNotif = await prisma.notification.create({
        data:{
            message: Msg,
            type: "IA",
            utilisateurId : parseInt(utilisateurId)
      }})
      req.io.emit('notifLimiteKit', newNotif);
    }else{
      cron.schedule('59 23 * * *', async() => {
        console.log(`Félicitation, votre consommation n'a pas dépassé la limite de ${d4}kWh avant 23h59 !`);   
        Msg = `Félicitation, votre consommation n'a pas dépassé la limite de ${d4}kWh avant 23h59 !`
        await prisma.kitNotifStatus.update({
          where: {
            id: parseInt(idkitNotifStatus)
          },
          data: {
            d4: true
          }
        })
        const newNotif = await prisma.notification.create({
          data:{
              message: Msg,
              type: "IA",
              utilisateurId : parseInt(utilisateurId)
        }})
        req.io.emit('notifLimiteKit', newNotif);
      });
    }

    const data = {
      d1, 
      d2, 
      d3, 
      d4
    };

    return { data };
  } catch (error) {
    return { messageError: 'Erreur serveur' };
  }
}





/**
 * GET CONSOMMATION ON 2 PERIOD
 */

export const getKitConsommationByPeriod = async(req, res) => {
  try {
    const DID = req.body.DID;
    const startTime = req.body.startTime;
    const endTime = req.body.endTime;
    const ControlCode = "SwitchPowerStatis";

    // Check if the token exists and if it's still valid
    if (!cachedToken || tokenExpiration <= Date.now()) {
      // Fetch a new token if it doesn't exist or has expired
      const gettoken = await axios.get(`${port_ecozipo}/gettokenbykit`);
      cachedToken = gettoken.data.token;

      // Set the token expiration to 2 hours from now (2 * 60 * 60 * 1000 ms)
      tokenExpiration = Date.now() + (2 * 60 * 60 * 1000);
    }

    const token = cachedToken;

    const StartTime = await encodeTimeFunction(startTime);
    const EndTime = await encodeTimeFunction(endTime);

    if (StartTime.Time === 'NaN' || EndTime.Time === 'NaN') {
      return res.status(400).json({ messageError: "Date invalide!" });
    }

    const kitExit = await prisma.kit.findFirst({
      where: {
        DID: parseInt(DID)
      },
    });
    if (!kitExit) return res.status(404).json({ messageError: "Kit introuvable!" });

    const controlData = {
      Token: token,
      DID: parseInt(DID),
      ControlCode: ControlCode,
      ControlParam: {
        "StartTime": StartTime.Time,
        "EndTime": EndTime.Time
      }
    };

    const apiUrl = `${API_KIT}/api/device/controls`;

    const response = await axios.post(apiUrl, controlData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // console.log("response.data : ",response.data);

    const millejoule = response.data.Data.Power;
    const joule = millejoule / 1000;

    let timeInSeconds = response.data.Data.OpeningSecond;
    const kilowatts = (joule / (timeInSeconds * 1000)).toFixed(6);

    const timeInHours = timeInSeconds / 3600; // Conversion du temps en heures
    const kilowattHours = (kilowatts * timeInHours).toFixed(6);

    const kWh = kilowattHours;
    response.data.Data.kWh = parseFloat(kWh) || 0;

    
    // CALCULER LA CONSOMMATION
    const userAppareil = await prisma.userAppareil.findFirst({
      where: {
        kitId: kitExit.id,
      },
    });
    if (!userAppareil) return res.status(404).json({ messageError: "Cette kit n'est pas disponible!" });

    const compteElectricite = await prisma.compteElectriciteEau.findUnique({
      where: {
        id: userAppareil.compteElectriciteEauId
      },
      include: {
        Utilisateur: true
      },
    });
    // console.log(compteElectricite)
    if (!compteElectricite) return res.json({ messageError: "Vous n'avez pas du compte électricité!" });

    let tourneId = compteElectricite.referenceClient;
    let communeId = compteElectricite.communeClient.toString();
    let tarif = compteElectricite.tarif;
    let puissance = compteElectricite.puissance;
    let type = compteElectricite.categorie;
    let resultElectricite = {}
    let utilisateurId = compteElectricite.utilisateurId
    let kitId = kitExit.id

    resultElectricite = await CalculEletriciteKit(tourneId, communeId, tarif, kWh, puissance, type, kitId, utilisateurId);
    if (resultElectricite.messageError) return res.status(400).json({ messageError: resultElectricite.messageError });  
    
    response.data.Data.prix = parseFloat(resultElectricite.facture.prixKwh.toFixed(2)) || 0;

    res.json({
      Msg: '',
      Data: response.data
    });

  } catch (error) {
    res.status(500).json({ messageError: 'Erreur serveur' });
  }
}





/**
 * GET CONSOMMATION ON YEAR
 */
export const getKitConsommationByYear = async(req, res) => {
  try {
    // const gettoken = await axios.get(`${port_ecozipo}/gettokenbykit`);
    const DID = req.body.DID;
    // const ControlCode = "SwitchPowerStatis";
    // const token = gettoken.data.token;
    let valid = false
    const year = req.body.year;
    let type = req.body.type

    if(!type) type = "kwh"

    let mois = {
      jan: 0, fev: 0, mar: 0, avr: 0, mai: 0, jui: 0, juil: 0, aou: 0, sep: 0, oct: 0, nov: 0, dec: 0
    };

    const kitExist = await prisma.kit.findFirst({
      where: {
        DID: parseInt(DID)
      },
    });

    if (!kitExist) return res.status(404).json({ messageError: "Kit introuvable!" });

    // let apiUrl = `${API_KIT}/api/device/controls`;

    for (let month = 0; month < 12; month++) {
      let response = {};
      let value = 0

      // Calcul de la date du début du mois
      const startDate = new Date(year, month, 1);

      // Calcul de la fin du mois
      const endDate = new Date(year, month + 1, 0, 23, 59, 59);


      // GET VALEUR BY MOIS
      try {
        response = await axios.post(`${port_ecozipo}/getkitconsommationbyperiod`, {DID : DID, startTime : startDate.toLocaleDateString(), endTime : endDate.toLocaleDateString()});

        if(type === 'kwh') value = response.data.Data.Data.kWh || 0;
        else value = response.data.Data.Data.prix || 0;
        valid = true
      } catch (error) {
        valid = false
        continue;
      }

      
     

      // Stocker la valeur de consommation dans l'objet `mois`
      switch (month) {
        case 0: mois.jan = parseFloat(value); break;
        case 1: mois.fev = parseFloat(value); break;
        case 2: mois.mar = parseFloat(value); break;
        case 3: mois.avr = parseFloat(value); break;
        case 4: mois.mai = parseFloat(value); break;
        case 5: mois.jui = parseFloat(value); break;
        case 6: mois.juil = parseFloat(value); break;
        case 7: mois.aou = parseFloat(value); break;
        case 8: mois.sep = parseFloat(value); break;
        case 9: mois.oct = parseFloat(value); break;
        case 10: mois.nov = parseFloat(value); break;
        case 11: mois.dec = parseFloat(value); break;
      }
    }
    let totalConsommation = Object.values(mois).reduce((acc, curr) => acc + curr, 0);
    let Msg = ""
    let status = 200
    if(valid) Msg = 'Consommation annuelle récupérée avec succès', status = 200
    else Msg = 'Vous êtez hors ligne, Veuillez verifier votre connexion!', status = 500

    res.status(status).json({
      Msg: Msg,
      Data: mois,
      type: type,
      total: totalConsommation
    });

  } catch (error) {
    res.status(500).json({ messageError: 'Vous êtez hors ligne, Veuillez verifier votre connexion!' });
  }
};




/**
 * GET CONSOMMATION ON WEEK
 */
export const getKitConsommationOnWeek = async (req, res) => {
  try {
    const DID = req.body.DID;
    let date = req.body.date; // La date fournie par l'utilisateur
    let type = req.body.type || "kwh";
    let valid = false;

    // Conversion de la date fournie au format JS
    date = new Date(Date.parse(date.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$2/$1/$3')));
    
    if (isNaN(date.getTime())) {
      return res.status(400).json({ messageError: "Date invalide ! Veuillez entrer une date valide au format JJ/MM/AAAA." });
    }

    // Vérifie si le kit existe
    const kitExist = await prisma.kit.findFirst({
      where: { DID: parseInt(DID) },
    });
    if (!kitExist) return res.status(404).json({ messageError: "Kit introuvable!" });

    // Calcul du premier jour de la semaine (lundi)
    const dayOfWeek = date.getDay(); // 0 (dimanche) à 6 (samedi)
    const startDate = new Date(date);
    startDate.setDate(date.getDate() - ((dayOfWeek + 6) % 7)); // Se décaler pour avoir le lundi
    startDate.setHours(0, 1, 0, 0); // 00:01 au début de la semaine

    // Calcul du dernier jour de la semaine (dimanche)
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999); 

    // Initialisation de l'objet de consommation par jour de la semaine
    let semaine = { lun: 0, mar: 0, mer: 0, jeu: 0, ven: 0, sam: 0, dim: 0 };
    const joursSemaine = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"];

    // Boucle à travers chaque jour de la semaine
    for (let i = 0; i < 7; i++) {
      let currentDayStart = new Date(startDate);
      currentDayStart.setDate(startDate.getDate() + i); 
      currentDayStart.setHours(0, 1, 0, 0);

      let currentDayEnd = new Date(currentDayStart);
      currentDayEnd.setHours(23, 59, 59, 999);

      try {
        const response = await axios.post(`${port_ecozipo}/getkitconsommationbyperiod`, {
          DID: DID,
          startTime: currentDayStart,
          endTime: currentDayEnd,
        });

        let value = type === "kwh" ? response.data.Data.Data.kWh || 0 : response.data.Data.Data.prix || 0;
        semaine[joursSemaine[i]] = parseFloat(value);
        valid = true;

      } catch (error) {
        valid = false;
        continue;
      }
    }

    // Calcul de la consommation totale de la semaine
    let totalConsommation = Object.values(semaine).reduce((acc, curr) => acc + curr, 0);
    let Msg = valid ? "Consommation hebdomadaire récupérée avec succès" : "Vous êtes hors ligne, veuillez vérifier votre connexion!";
    let status = valid ? 200 : 500;

    res.status(status).json({
      Msg: Msg,
      Data: semaine,
      type: type,
      total: parseFloat(totalConsommation).toFixed(6),
      semaine: {
        startDate: new Date(startDate.setDate(startDate.getDate() + 1)).toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      }
    });
  } catch (error) {
    res.status(500).json({ messageError: "Vous êtes hors ligne, veuillez vérifier votre connexion!" });
  }
};






/**
 * ALLUMER  OR ÉTEINDRE KIT 
 **/ 
export const KitOnorOff = async(req, res) =>{
  try {
      const DID = req.body.DID;
      const status = req.body.status;
      const ControlCode = "SwitchChange"
     
      
      // Check if the token exists and if it's still valid
      if (!cachedToken || tokenExpiration <= Date.now()) {
        // Fetch a new token if it doesn't exist or has expired
        const gettoken = await axios.get(`${port_ecozipo}/gettokenbykit`);
        cachedToken = gettoken.data.token;

        // Set the token expiration to 2 hours from now (2 * 60 * 60 * 1000 ms)
        tokenExpiration = Date.now() + (2 * 60 * 60 * 1000);
      }

      const token = cachedToken;

      const kitExit = await prisma.kit.findFirst({
        where: {
            DID: parseInt(DID)
        },
      });
      if(!kitExit)return res.status(404).json({ messageError: "Kit introuvable!" });

      const controlData = {
        Token: token,  
        DID: parseInt(DID), 
        ControlCode: ControlCode,
        ControlParam: {
          "SwitchNo":0,
          "Switch": parseInt(status)
        } 
      };

      const apiUrl = `${API_KIT}/api/device/controls`;

      const response = await axios.post(apiUrl, controlData, {
        headers: {
          'Content-Type': 'application/json' 
        }
      });

      let Msg = ''
      let statusMsg = 0
      if(parseInt(status) === 0) {
        await prisma.kit.update({
          where: { id: kitExit.id },
          data: {
            kitStatus : false,
            statusMain: true
          }
        });
        Msg = "Votre kit est éteint"
        statusMsg = 0
      }else {
        await prisma.kit.update({
          where: { id: kitExit.id },
          data: {
            kitStatus : true,
            statusMain: false
          }
        });
        Msg = "Votre kit est allumé"
        statusMsg = 1
      }

      // Émettre une Socket.IO
      req.io.emit('socketKitOnOff', {
          Msg : Msg,
          DID : DID,
          status : statusMsg
      });

      res.json({
          Msg : Msg,
          Data : response.data
      })
     
    } catch (error) {
      res.status(500).json({ messageError: 'Erreur serveur' });
    }
}




/**
 * CREATE KIT USER
 */
export const createKitUser = async(req, res) =>{
  try {
      const DID = req.body.DID;
      const compteElectriciteEauId = req.body.compteElectriciteEauId;

      const compteUser = await prisma.compteElectriciteEau.findUnique({
        where: {
            id: parseInt(compteElectriciteEauId)
        },
      });
      if (!compteUser )  return res.status(404).json({ messageError: "Compteur introuvable!" });

      
      const kitExit = await prisma.kit.findFirst({
          where: {
              DID: parseInt(DID)
          },
      });
      if(!kitExit) {
        return res.status(404).json({ messageError: "Kit introuvable!" });
      }else{
        if(kitExit.status) return res.status(403).json({ messageError: "Ce kit est déjà prise!" });
      }


      let calculDernierFacture = await CalculTroisDernierFacture(compteElectriciteEauId);
      if (calculDernierFacture.messageError) return res.status(400).json({ messageError: resultElectricite.messageError });  
      
      const newKitUser = await prisma.userAppareil.create({
          data:{
              utilisateurId: parseInt(compteUser.utilisateurId),
              kitId: kitExit.id,
              compteElectriciteEauId: parseInt(compteElectriciteEauId),
              kitGroupeId: 1
      }})

      
      // si le kit est un disjoncteur
      if(kitExit.kitTypeId === 1){
        let consommationMin = calculDernierFacture.data.min
        let tranche = calculDernierFacture.data.tranche
        let pourcentageTranche = calculDernierFacture.data.valeurEconomiser.toString()+"%"
        let consommationBut = calculDernierFacture.data.consommationNormal
        let consommationJour = calculDernierFacture.data.consommationJour
        let consommationHeure = calculDernierFacture.data.consommationHeure
        
        let analyseIA = await ReponseIACreateKitUser(calculDernierFacture.data);
        if (analyseIA.messageError) return res.status(400).json({ messageError: resultElectricite.messageError });  
        // console.log("analyseIA.message : ",analyseIA.message)
        // console.log("compteUser.utilisateurId : ",compteUser.utilisateurId);
        // Déclencher la notification
        const newNotif = await prisma.notification.create({
          data:{
              message: analyseIA.message,
              type: "IA",
              utilisateurId : parseInt(compteUser.utilisateurId)
        }})
        console.log("newNotif : ",newNotif)
        req.io.emit('notifIA', newNotif);

        // Mettre à jour le kit
        await prisma.kit.update({
            where: { id: kitExit.id },
            data: {
              status : true,
              consommationMin: consommationMin,
              tranche: tranche,
              pourcentageTranche: pourcentageTranche,
              consommationBut: consommationBut,
              consommationJour: consommationJour,
              consommationHeure: consommationHeure
            }
        });

      }else{
        // Mettre à jour le kit
        await prisma.kit.update({
          where: { id: kitExit.id },
          data: {
            status : true
          }
        });
      }
     

      // Ajouter le kit dans la table 'KitNotifStatus'
      await prisma.kitNotifStatus.create({
        data:{
            kitId: kitExit.id
      }})

     

        
      res.status(200).json({ 
          messageSuccess: "L'appareil est bien ajouté à cette utilisateur",
          kit: newKitUser
      });

    } catch (error) {
      res.status(500).json({ messageError: 'Erreur serveur' });
    }
}




/**
 * UPDATE KIT IN GROUPE
 */
export const updateKitInGroupe = async(req, res) =>{
  try {
      const DID = req.body.DID
      const kitGroupeId = req.body.kitGroupeId
      const token = req.body.token;
      let utilisateurId = ""
      let kitId = ''

      const decodedToken = jwt.decode(token);  
      if (!decodedToken || !decodedToken.user)   return res.status(403).json({ Msg: 'Token invalide' });
      if(!DID) return res.status(403).json({ Msg: 'DID requise' });
      if(!kitGroupeId) return res.status(403).json({ Msg: 'kitGroupeId requise' });
      
      utilisateurId= decodedToken.user;  
      


      const kitExit = await prisma.kit.findFirst({
        where:{
            DID: parseInt(DID)
        }
      })
      if(!kitExit) return res.status(403).json({Msg: "Cette appareil n'existe pas!"})

      kitId = kitExit.id

      const userAppareilExit = await prisma.userAppareil.findFirst({
        where:{
            AND: [
                { kitId: parseInt(kitId) },
                { utilisateurId: parseInt(utilisateurId) }
            ]
        }
      })
      if(!userAppareilExit) return res.status(403).json({Msg: "Appareil Introuvable!"})


      const kitGroupeExit = await prisma.kitGroupe.findFirst({
          where:{
              AND: [
                  { id: parseInt(kitGroupeId) },
                  { utilisateurId: parseInt(utilisateurId) }
              ]
          }
      })
      if(!kitGroupeExit) return res.status(403).json({Msg: "Groupe Introuvable!"})
      
      
      
      const updateUserAppareil = await prisma.userAppareil.update({
          where: {
              id: userAppareilExit.id,
          },
          data: {
              kitGroupeId: parseInt(kitGroupeId)
          },
      });

      res.status(201).json({
        Msg:"Le kit est modifié de groupe",
        Data: updateUserAppareil
      })
      
     
    } catch (error) {
      res.status(500).json({ Msg: 'Erreur serveur' });
    }
}




/**
 * GET HISTORIQUE BY MONTH
 */
export const getHistoriqueByMois = async(req, res) =>{
  try {
      const gettoken = await axios.get(`${port_ecozipo}/gettokenbykit`);
      const DID = req.body.DID;
      const startTime = req.body.startTime;
      const endTime = req.body.endTime;
      const ControlCode = "SwitchRecord"
      const token = gettoken.data.token

      const StartTime = await encodeTimeFunction(startTime);
      const EndTime = await encodeTimeFunction(endTime);


      // Calculer la différence en secondes
      const differenceInSeconds = EndTime.Time - StartTime.Time;

      // Convertir les secondes en heures
      const differenceInHours = differenceInSeconds / 3600;

      
      if(StartTime.Time === 'NaN' || EndTime.Time === 'NaN') return res.status(400).json({ messageError: "Date invalide!" });

      const kitExit = await prisma.kit.findFirst({
        where: {
            DID: parseInt(DID)
        },
      });
      if(!kitExit)return res.status(404).json({ messageError: "Kit introuvable!" });


      let controlData = {
        Token: token,  
        DID: parseInt(DID), 
        ControlCode: ControlCode,
        ControlParam: {
          "StartTime":parseInt(StartTime.Time),
          "EndTime": parseInt(EndTime.Time),
          "PageSize": 1000,
          "PageNumber":1
        } 
      };


      const apiUrl = `${API_KIT}/api/device/controls`;


      const response = await axios.post(apiUrl, controlData, {
        headers: {
          'Content-Type': 'application/json' 
        }
      });

      if(response.data != null){
        for (let index = 0; index < response.data.Data.ControlRecordList.length; index++) {

          // decodedate
          let time = response.data.Data.ControlRecordList[index].OpenTime.toString()
          // let decodeTime = await axios.post(`${port_ecozipo}/decodetime`, {time : time.toString()}); 
          let decodeTime = await decodeTimeFunction(time);
          response.data.Data.ControlRecordList[index].time = decodeTime.Time


          // action 
          let action = ''
          let openType = response.data.Data.ControlRecordList[index].OpenType
          if(openType === 0) action = "Eteindre l'appareil"
          if(openType === 1) action = "Interrupteur manuel"
          else if(openType === 2) action = "Allumage de l'appareil"
          response.data.Data.ControlRecordList[index].action = action

          
     
          response.data.Data.ControlRecordList[index].Power = response.data.Data.ControlRecordList[index].Power / 1000
          let kWh = ((response.data.Data.ControlRecordList[index].Power * 1) / 1000) / differenceInHours;
          response.data.Data.ControlRecordList[index].kWh = parseFloat(kWh.toFixed(3));
          kWh = response.data.Data.ControlRecordList[index].kWh 
          
        
          // CALCULER LA CONSOMMATION
          const userAppareil = await prisma.userAppareil.findFirst({
            where: {
              id: kitExit.id,
            },
          });
          if (!userAppareil) return res.status(404).json({ messageError: "Cette kit n'est pas disponible!" });
      
          const compteElectricite = await prisma.compteElectriciteEau.findUnique({
            where:{
              id : userAppareil.id
            },
            include: {
                Utilisateur: true
            },
          })
          if (!compteElectricite) return res.json({ messageError: "Vous n'avez pas du compte électricité!" });
          let tourneId = compteElectricite.referenceClient
          let communeId = compteElectricite.communeClient.toString()
          let tarif = compteElectricite.tarif
          let puissance = compteElectricite.puissance
          let type = compteElectricite.categorie
       
          const resultElectricite = await CalculEletriciteKit(tourneId, communeId, tarif, kWh, puissance, type);
          if (resultElectricite.messageError)  return res.status(400).json({ messageError: resultElectricite.messageError });
      
          response.data.Data.ControlRecordList[index].prix = parseFloat(resultElectricite.facture.prixKwh.toFixed(2))
        }
      } 

      

      res.json({
          Msg : '',
          Data : response.data
      })
     
    } catch (error) {
      res.status(500).json({ messageError: 'Erreur serveur' });
    }
}






/**
 * GET ALL ACTIONS KIT
 **/ 
export const getAllActionKit = async(req, res) =>{
  try {
      const gettoken = await axios.get(`${port_ecozipo}/gettokenbykit`);
      const DID = req.body.DID;
      const ControlCode = "SwitchQuerySchedule"
      const token = gettoken.data.token
     
      const kitExit = await prisma.kit.findFirst({
        where: {
            DID: parseInt(DID)
        },
      });
      if(!kitExit)return res.status(404).json({ messageError: "Kit introuvable!" });

      const controlData = {
        Token: token,  
        DID: parseInt(DID), 
        ControlCode: ControlCode,
        ControlParam: null
      };

      const apiUrl = `${API_KIT}/api/device/controls`;

      const response = await axios.post(apiUrl, controlData, {
        headers: {
          'Content-Type': 'application/json' 
        }
      });
      
      const updatedData = response.data.Data.map(item => {
        return {
          ...item,
          ScheduleHour: item.ScheduleHour + 3
        };
      });

      res.json({
          Msg : "Listes des controles mis à jour",
          Data : updatedData
      })
     
    } catch (error) {
      res.status(500).json({ messageError: 'Erreur serveur' });
    }
}




/**
 *  ADD ACTIONS  KIT
 **/ 
export const addActionKit = async (req, res) => {
  try {
    const gettoken = await axios.get(`${port_ecozipo}/gettokenbykit`);
    const DID = req.body.DID;
    const ControlCode = "SwitchSetSchedule";
    const token = gettoken.data.token;
    const heure = req.body.heure;
    const minute = req.body.minute;
    const action = req.body.action;
    const ScheduleCycle = req.body.ScheduleCycle;
    let nameAction = "";

    if (parseInt(action) === 0) nameAction = `ClosePower`;
    else if (parseInt(action) === 1) nameAction = `OpenPower`;

    const kitExit = await prisma.kit.findFirst({
      where: {
        DID: parseInt(DID),
      },
    });
    if (!kitExit) return res.status(404).json({ messageError: "Kit introuvable!" });

    const getLengthAction = await axios.post(`${port_ecozipo}/getallactionkit`, { DID: parseInt(DID) });

    // Trouver le plus grand ScheduleID et l'incrémenter pour obtenir un nouveau ScheduleID unique
    const maxScheduleID = getLengthAction.data.Data.reduce((max, action) => {
      return action.ScheduleID > max ? action.ScheduleID : max;
    }, 0);

    const newScheduleID = maxScheduleID + 1; // Incrémenter le plus grand ScheduleID

    const controlData = {
      Token: token,
      DID: parseInt(DID),
      ControlCode: ControlCode,
      ControlParam: {
        "ScheduleID": newScheduleID, 
        "ScheduleName": nameAction,
        "SwitchNo": 0,
        "EnabledStatus": 1,
        "ScheduleHour": parseInt(heure) - 3,
        "ScheduleMinute": parseInt(minute),
        "SwitchAction": parseInt(action),
        "ScheduleCycle": ScheduleCycle,
      },
    };


    const apiUrl = `${API_KIT}/api/device/controls`;

    const response = await axios.post(apiUrl, controlData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });


    let Msg = '';
    let status = 200;

    if (parseInt(action) === 0) Msg = `Votre kit s'éteint à ${heure}h${minute}`;
    else Msg = `Votre kit est allumé à ${heure}h${minute}`;

    if (response.data.Code === -1) Msg = "Opération échouée", status = 500;
    else if (response.data.Code === 1) Msg = "Token expiré", status = 401;
    else if (response.data.Code === 3) Msg = "L'appareil n'est pas en ligne", status = 503;
    else if (response.data.Code === 9) Msg = "Ne prend pas en charge le type d'appareil", status = 400;
    else if (response.data.Code === 15) Msg = "Pas d'accès", status = 403;
    else if (response.data.Code === 112) Msg = "Opération échouée", status = 408;

    res.status(status).json({
      Msg: Msg,
      Data: response.data,
    });

  } catch (error) {
    res.status(500).json({ messageError: 'Erreur serveur' });
  }
};





/**
 *  UPDATE ACTIONS  KIT
 **/ 
export const updateActionKit = async(req, res) =>{
  try {
      const gettoken = await axios.get(`${port_ecozipo}/gettokenbykit`);
      const DID = req.body.DID;
      const ControlCode = "SwitchSetSchedule"
      const token = gettoken.data.token
      const heure = req.body.heure
      const minute = req.body.minute
      const action = req.body.action
      const ScheduleCycle = req.body.ScheduleCycle 
      const ScheduleID = req.body.ScheduleID
      let EnabledStatus = req.body.EnabledStatus

      if(!EnabledStatus) EnabledStatus = 1

      const kitExit = await prisma.kit.findFirst({
        where: {
            DID: parseInt(DID)
        },
      });
      if(!kitExit)return res.status(404).json({ messageError: "Kit introuvable!" });


      const controlData = {
        Token: token,  
        DID: parseInt(DID), 
        ControlCode: ControlCode,
        ControlParam: {
          "ScheduleID": parseInt(ScheduleID),
          "ScheduleName":"ClosePower",
          "SwitchNo":0,
          "EnabledStatus":parseInt(EnabledStatus),
          "ScheduleHour": parseInt(heure) - 3,
          "ScheduleMinute": parseInt(minute),
          "SwitchAction": parseInt(action),
          "ScheduleCycle": ScheduleCycle
        }
      };


      const apiUrl = `${API_KIT}/api/device/controls`;

      const response = await axios.post(apiUrl, controlData, {
        headers: {
          'Content-Type': 'application/json' 
        }
      });

      

      res.json({
          Msg : "Action modifié",
          Data : response.data
      })
     
    } catch (error) {
      res.status(500).json({ messageError: 'Erreur serveur' });
    }
}




/**
 *  DELETE ACTION KIT
 **/ 
export const deleteActionKit = async(req, res) =>{
  try {
      const gettoken = await axios.get(`${port_ecozipo}/gettokenbykit`);
      const DID = req.body.DID;
      const ControlCode = "SwitchDeleteSchedule"
      const token = gettoken.data.token
      const ScheduleID = req.body.ScheduleID
     
      const kitExit = await prisma.kit.findFirst({
        where: {
            DID: parseInt(DID)
        },
      });
      if(!kitExit)return res.status(404).json({ messageError: "Kit introuvable!" });


  
      const controlData = {
        Token: token,  
        DID: parseInt(DID), 
        ControlCode: ControlCode,
        ControlParam: {
          "ScheduleID": parseInt(ScheduleID)
        }
      };

      const apiUrl = `${API_KIT}/api/device/controls`;

      const response = await axios.post(apiUrl, controlData, {
        headers: {
          'Content-Type': 'application/json' 
        }
      });

      res.json({
          Msg : "Votre action a été supprimée",
          Data : response.data
      })
     
    } catch (error) {
      res.status(500).json({ messageError: 'Erreur serveur' });
    }
}








