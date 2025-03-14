import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv';
import axios from 'axios'
import axiosRetry from 'axios-retry'
import crypto from 'crypto';
import { getTokens } from '../../utils/tokenStore.js';
import { GenerateSign } from '../ConfigController.js';
import { comparaisonDate, functionGetStatisticsKitTongou, functionGetStatusKitTongou, functionSeeKitOffline, getDateFormated, getTodayDateFormatted } from './KitTongouController.js';
import { CalculKwhParIndiceTranche, CalculKwhTrancheParGraph, CalculTKwhEnAriaryTTC, CalculTKwhParTranche, CalculTroisDernierFacture } from '../JiramaCalculController.js';
import { ReponseIAKit } from '../ChatController.js';
import { ReponseIACreateKitUser } from './KitTongouIAController.js';
import { formatYYYYMMDDtoDate } from './KitTongouAutoReleveController.js';

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
export const getAllKitTongouUserEcoZipo = async (req, res) => {
  try {
    let response = await prisma.kitTongouUser.findMany({
      include: {
        CompteElectriciteEau: {
          include: {
            Utilisateur: true
          }
        },
        KitTongou: {
          include: {
            KitType: true,
            KitTypeTongou: true
          }
        },
      },
      orderBy: {
        id: 'asc',
      },
    });

    

    res.status(200).json({
      Msg: "Listes des kits activés",
      TotalCount: response.length,
      Data: response,
    });

  } catch (error) {
    res.status(500).json({ messageError: error.message});
  }
};




/**
 * GET ALL KIT TONGOU USER
 */
// export const getAllKitTongouUsers = async (req, res) => {
//   try {
//     const utilisateurId = parseInt(req.body.utilisateurId);

//     // Fetch kits and related data in a single Prisma query
//     const kits = await prisma.kitTongouUser.findMany({
//       where: { utilisateurId },
//       include: {
//         CompteElectriciteEau: true,
//         KitTongou: {
//           include: { KitType: true, KitTypeTongou: true },
//         },
//       },
//       orderBy: { id: 'asc' },
//     });

//     // Fetch external API data
//     const app_tongou = await axios.get(`${port_ecozipo}/getallkittongou`);
//     const externalData = app_tongou.data.result.reduce((acc, item) => {
//       acc[item.id] = {
//         kitOnOff: JSON.parse(item.status[0].value) === "true",
//         online: item.online,
//       };
//       console.log("acc : ",acc);
      
//       return acc;
//     }, {});

//     // Update kits with external data in parallel
//     await Promise.all(
//       Object.keys(externalData).map(async (id) => {
//         const kit = await prisma.kitTongou.findFirst({
//           where: { idKitTongou: id },
//         });
//         console.log("externalData : ",externalData);
        
//         if (kit) {
//           await prisma.kitTongou.update({
//             where: { id: kit.id },
//             data: externalData[id],
//           });
//         }
//       })
//     );

//     // Process kits and enrich data in parallel
//     const enrichedKits = await Promise.all(
//       kits.map(async (kit) => {
        
//         const { KitTongou } = kit;
//         const { CompteElectriciteEau } = kit
//         let device_id = KitTongou.idKitTongou


        

//         /**
//          * Limite kwh 1er tranche
//          */
//         let tourneId = CompteElectriciteEau.referenceClient
//         let tourneSlice = tourneId.slice(0, 7)
//         let communeId = CompteElectriciteEau.communeClient.toString()
//         let tarif = CompteElectriciteEau.tarif
//         const agence = await prisma.agence.findFirst({
//           where:{
//             AND:[
//               {tourneId : tourneSlice},
//               {communeId : parseInt(communeId)}
//             ]
//           },
//         })
//         const prix = await prisma.prix.findFirst({
//           where: {
//             AND: [
//               { zoneId: agence.zoneId },
//               { tarif: tarif }
//             ]
//           }
//         });
//         CompteElectriciteEau.limitekWh = prix.q1

//         const kitValeurBut = await prisma.kitValeurBut.findFirst({
//           where: { kitTongouId: KitTongou.id }, include: { modeGestion: true },
//         });

//         /**
//          * Limite consommation
//          */
//         KitTongou.limite = [
//           { mois: kitValeurBut.consommationMin, jour: kitValeurBut.consommationJour },
//         ];



//         /**
//          * Kwh personnaliser et mode gestion
//          */
        
//         KitTongou.kwhPersonnaliser = kitValeurBut.typeValeurBut
//         KitTongou.modeGestion = kitValeurBut.modeGestion.mode

        
//         /**
//          * get consommation par mois
//          **/ 
//         let dateReleve = CompteElectriciteEau.dateReleve;
//         if(dateReleve === null) return res.status(400).json({ message: "La date de relevé est obligatoire." });

//         let rep_consommation_mois = await getConsommationKitTongouMois(device_id, CompteElectriciteEau.id, dateReleve);
//         KitTongou.consommationMois = [{
//           consommation: rep_consommation_mois.data.consommation,
//           prix: rep_consommation_mois.data.prixTTC,
//           start_mois: rep_consommation_mois.start_time,
//           end_mois: rep_consommation_mois.dateReleve
//         }];


//         /**
//          * get consommation par jour
//          */
//         const todayFormatted = getTodayDateFormatted();
//         let rep_consommation = await functionGetStatisticsKitTongou(device_id, "add_ele", todayFormatted, todayFormatted, "sum", "days"); 
//         if(rep_consommation.data){
//           const value1Data = rep_consommation.data.result;
//           const consommationKWh = Object.values(value1Data)[0]; 
//           const prixttt = await CalculTKwhEnAriaryTTC(CompteElectriciteEau.id, consommationKWh)
//           const prix = prixttt.data.prixTotalTranche
//           KitTongou.consommationJour = [{
//             consommation: consommationKWh,
//             prix: prix 
//           }];
//           await sendMsgIAParJour (utilisateurId, KitTongou.id, prix, consommationKWh, req.io)
//         }else{
//           KitTongou.consommationJour = [];
//         }

      

//         /**
//          * get puissance
//          */
//         let rep_puissance = await functionGetStatusKitTongou(device_id, "cur_power", req.io); 
//         if (rep_puissance.data.result) {
//           let puissanceValue = parseFloat(rep_puissance.data.result[0].value) / 10;
//           KitTongou.puissance = [{
//             code: rep_puissance.data.result[0].code,
//             value: puissanceValue.toFixed(1)  
//           }];
//         } else {
//           KitTongou.puissance = [];
//         }


//         /**
//          * get courant
//          */
//         let rep_courant = await functionGetStatusKitTongou(device_id, "cur_current", req.io); 
//         if (rep_courant.data.result) {
//           let courantValue = parseFloat(rep_courant.data.result[0].value) / 1000;
//           KitTongou.courant = [{
//             code: rep_courant.data.result[0].code,
//             value: courantValue.toFixed(2)  
//           }];
//         } else {
//           KitTongou.courant = [];
//         }



//         /**
//          * voltage
//          */
//         let rep_voltage = await functionGetStatusKitTongou(device_id, "cur_voltage", req.io); 

//         if (rep_voltage.data.result) {
//           let voltageValue = parseFloat(rep_voltage.data.result[0].value) / 10;
//           KitTongou.voltage = [{
//             code: rep_voltage.data.result[0].code,
//             value: voltageValue.toFixed(1)  // Garde une décimale
//           }];
//         } else {
//           KitTongou.voltage = [];
//         }



//        /**
//        * get lat & long kit
//        */
//        const weatherKit = await prisma.weatherKit.findFirst({
//          where: {
//           kitTongouId: KitTongou.id
//          }
//        });
//        if (weatherKit) {
//          KitTongou.position = [{
//            lat: weatherKit.lat,
//            lon: weatherKit.lon
//          }];
//        } else {
//         KitTongou.position = [{
//           lat: 0,
//           lon: 0
//         }];
//        }


//         return kit;
//       })
//     );

//     res.status(200).json({
//       Msg: "Listes de vos kits",
//       TotalCount: enrichedKits.length,
//       Data: enrichedKits,
//     });
//   } catch (error) {
//     res.status(500).json({ messageError: error.message });
//   }
// };

export const getAllKitTongouUser = async (req, res) => {
  try {
    let utilisateurId = req.body.utilisateurId;
    let response = await prisma.kitTongouUser.findMany({
      where: {
        utilisateurId: parseInt(utilisateurId),
      },
      include: {
        CompteElectriciteEau: true,
        KitTongou: {
          include: {
            KitType: true,    
            KitTypeTongou: true
          }
        },
      },
      orderBy: {
        id: 'asc',
      },
    });

    
    
    let app_tongou = await axios.get(`${port_ecozipo}/getallkittongou`);
    for (let index = 0; index < app_tongou.data.result.length; index++) {
      let kitOnOff = JSON.parse(app_tongou.data.result[index].status[0].value);
      let online = app_tongou.data.result[index].online;
      if(kitOnOff === "true") kitOnOff = true
      else if(kitOnOff === "false") kitOnOff = false
      // console.log("result : ",app_tongou.data.result);
      
      // console.log("kitOnOff : ",kitOnOff);
      // console.log("online : ",online);
      
      // console.log("--");
      
      let idKit = app_tongou.data.result[index].id;
      let kit = await prisma.kitTongou.findFirst({
        where: {
          idKitTongou: idKit,
        },
      });
      if(kit){
        // console.log(kit.id);
        await prisma.kitTongou.update({
          where: {
            id: kit.id,
          },
          data: {
            online: online,
            kitOnOff: kitOnOff
          },
        });
      }
    }

    response = await prisma.kitTongouUser.findMany({
      where: {
        utilisateurId: parseInt(utilisateurId),
      },
      include: {
        CompteElectriciteEau: true,
        KitTongou: {
          include: {
            KitType: true,
            KitTypeTongou: true
          }
        },
      },
      orderBy: {
        id: 'asc',
      },
    });


    for (let index = 0; index < response.length; index++) {
      let device_id = response[index].KitTongou.idKitTongou;
      let rep_consommation_mois = {}
      let p = {}
      let dateReleve = ""

      // see if kit is offline
      let seeKitOffline =   await functionSeeKitOffline(device_id);
      // console.log("seeKitOffline : ",seeKitOffline);
     
      // get kitTongou
      let kitTongouId = await prisma.kitTongou.findFirst({
        where: {
          idKitTongou: device_id,
        },
      });


      // find typeValeurBut in KitValeurBut
      let KitValeurBut = await prisma.kitValeurBut.findFirst({
        where: {
          kitTongouId: kitTongouId.id
        },
        include: {
          modeGestion: true
        }
      });
      response[index].kwhPersonnaliser = KitValeurBut.typeValeurBut
      response[index].modeGestion = KitValeurBut.modeGestion.mode


      // get kitTongouUser
      let compteElectriciteEauIdKit = await prisma.kitTongouUser.findFirst({
        where: {
          kitTongouId: kitTongouId.id,
        }
      });

      // get compteElectriciteEau
      let compteElectriciteEau = await prisma.compteElectriciteEau.findUnique({
        where: {
          id: parseInt(compteElectriciteEauIdKit.compteElectriciteEauId)
        }
      });
      let utilisateurId = compteElectriciteEau.utilisateurId


      // get limite kit
      let tourneId = compteElectriciteEau.referenceClient
      let tourneSlice = tourneId.slice(0, 7)
      let communeId = compteElectriciteEau.communeClient.toString()
      let tarif = compteElectriciteEau.tarif
      const agence = await prisma.agence.findFirst({
        where:{
          AND:[
            {tourneId : tourneSlice},
            {communeId : parseInt(communeId)}
          ]
        },
      })
      const prix = await prisma.prix.findFirst({
        where: {
          AND: [
            { zoneId: agence.zoneId },
            { tarif: tarif }
          ]
        }
      });
      response[index].CompteElectriciteEau.limitekWh = prix.q1


      // get kitValeurBut
      let kitValeurBut = await prisma.kitValeurBut.findFirst({
        where: {
          kitTongouId: kitTongouId.id
        }
      });

      /**
       * Limite consommation
       */
      response[index].KitTongou.limite = [{
        mois: kitValeurBut.consommationMin,
        jour: kitValeurBut.consommationJour
      }];

      /**
       * get consommation par mois
       **/ 
      dateReleve = compteElectriciteEau.dateReleve;
      if(dateReleve === null) return res.status(400).json({ message: "La date de relevé est obligatoire." });

      rep_consommation_mois = await getConsommationKitTongouMois(device_id, compteElectriciteEau.id, dateReleve);
      response[index].KitTongou.consommationMois = [{
        consommation: rep_consommation_mois.data.consommation,
        prix: rep_consommation_mois.data.prixTTC,
        start_mois: rep_consommation_mois.start_time,
        end_mois: rep_consommation_mois.dateReleve
      }];


      // get consommation par jour
      const todayFormatted = getTodayDateFormatted();
      
      let rep_consommation = await functionGetStatisticsKitTongou(device_id, "add_ele", todayFormatted, todayFormatted, "sum", "days"); 
      
      if(rep_consommation.data){
        const value1Data = rep_consommation.data.result;
        const consommationKWh = Object.values(value1Data)[0]; 
        const prixttt = await CalculTKwhEnAriaryTTC(compteElectriciteEau.id, consommationKWh)
        const prix = prixttt.data.prixTotalTranche
        response[index].KitTongou.consommationJour = [{
          consommation: consommationKWh,
          prix: prix 
        }];
        await sendMsgIAParJour (utilisateurId, kitTongouId.id, prix, consommationKWh, req.io)
      }else{
        response[index].KitTongou.consommationJour = [];
      }

      

      /**
       * get puissance
       */
      let rep_puissance = await functionGetStatusKitTongou(device_id, "cur_power", req.io); 
      if (rep_puissance.data.result) {
        let puissanceValue = parseFloat(rep_puissance.data.result[0].value) / 10;
        response[index].KitTongou.puissance = [{
          code: rep_puissance.data.result[0].code,
          value: puissanceValue.toFixed(1)  
        }];
      } else {
        response[index].KitTongou.puissance = [];
      }


      /**
       * get courant
       */
      let rep_courant = await functionGetStatusKitTongou(device_id, "cur_current", req.io); 
      if (rep_courant.data.result) {
        let courantValue = parseFloat(rep_courant.data.result[0].value) / 1000;
        response[index].KitTongou.courant = [{
          code: rep_courant.data.result[0].code,
          value: courantValue.toFixed(2)  
        }];
      } else {
        response[index].KitTongou.courant = [];
      }



      /**
       * voltage
       */
      p = await functionGetStatusKitTongou(device_id, "cur_voltage", req.io); 

      if (p.data.result) {
        let voltageValue = parseFloat(p.data.result[0].value) / 10;
        response[index].KitTongou.voltage = [{
          code: p.data.result[0].code,
          value: voltageValue.toFixed(1)  // Garde une décimale
        }];
      } else {
        response[index].KitTongou.voltage = [];
      }



       /**
       * get lat & long kit
       */
       const weatherKit = await prisma.weatherKit.findFirst({
         where: {
          kitTongouId: kitTongouId.id
         }
       });
       if (weatherKit) {
         response[index].KitTongou.position = [{
           lat: weatherKit.lat,
           lon: weatherKit.lon
         }];
       } else {
        response[index].KitTongou.position = [{
          lat: 0,
          lon: 0
        }];
       }
    }

    res.status(200).json({
      Msg: "Listes de vos kits",
      TotalCount: response.length,
      Data: response,
    });

  } catch (error) {
    res.status(500).json({ messageError: error.message});
  }
};


export const getAllKitTongouUserNew = async (req, res) => {
  try {
    let utilisateurId = req.body.utilisateurId;
    let response = await prisma.kitTongouUser.findMany({
      where: {
        utilisateurId: parseInt(utilisateurId),
      },
      include: {
        CompteElectriciteEau: true,
        KitTongou: {
          include: {
            KitType: true,    
            KitTypeTongou: true
          }
        },
      },
      orderBy: {
        id: 'asc',
      },
    });

    
    
    // let app_tongou = await axios.get(`${port_ecozipo}/getallkittongou`);
    // for (let index = 0; index < app_tongou.data.result.length; index++) {
    //   let kitOnOff = JSON.parse(app_tongou.data.result[index].status[0].value);
    //   let online = app_tongou.data.result[index].online;
    //   if(kitOnOff === "true") kitOnOff = true
    //   else if(kitOnOff === "false") kitOnOff = false
    //   // console.log("result : ",app_tongou.data.result);
      
    //   // console.log("kitOnOff : ",kitOnOff);
    //   // console.log("online : ",online);
      
    //   // console.log("--");
      
    //   let idKit = app_tongou.data.result[index].id;
    //   let kit = await prisma.kitTongou.findFirst({
    //     where: {
    //       idKitTongou: idKit,
    //     },
    //   });
    //   if(kit){
    //     // console.log(kit.id);
    //     await prisma.kitTongou.update({
    //       where: {
    //         id: kit.id,
    //       },
    //       data: {
    //         online: online,
    //         kitOnOff: kitOnOff
    //       },
    //     });
    //   }
    // }

    // response = await prisma.kitTongouUser.findMany({
    //   where: {
    //     utilisateurId: parseInt(utilisateurId),
    //   },
    //   include: {
    //     CompteElectriciteEau: true,
    //     KitTongou: {
    //       include: {
    //         KitType: true,
    //         KitTypeTongou: true
    //       }
    //     },
    //   },
    //   orderBy: {
    //     id: 'asc',
    //   },
    // });

    
    

    for (let index = 0; index < response.length; index++) {
      let device_id = response[index].KitTongou.idKitTongou;
      let rep_consommation_mois = {}
      let p = {}
      let dateReleve = ""

      // console.log(response[index].KitTongou.pseudo, " : ", response[index].KitTongou.online);

      // see if kit is offline
      let seeKitOffline =   await functionSeeKitOffline(device_id);
      // console.log("seeKitOffline : ",seeKitOffline);
     
      // get kitTongou
      let kitTongouId = await prisma.kitTongou.findFirst({
        where: {
          idKitTongou: device_id,
        },
      });


      // find typeValeurBut in KitValeurBut
      let KitValeurBut = await prisma.kitValeurBut.findFirst({
        where: {
          kitTongouId: kitTongouId.id
        },
        include: {
          modeGestion: true
        }
      });
      response[index].kwhPersonnaliser = KitValeurBut.typeValeurBut
      response[index].modeGestion = KitValeurBut.modeGestion.mode


      // get kitTongouUser
      let compteElectriciteEauIdKit = await prisma.kitTongouUser.findFirst({
        where: {
          kitTongouId: kitTongouId.id,
        }
      });

      // get compteElectriciteEau
      let compteElectriciteEau = await prisma.compteElectriciteEau.findUnique({
        where: {
          id: parseInt(compteElectriciteEauIdKit.compteElectriciteEauId)
        }
      });
      let utilisateurId = compteElectriciteEau.utilisateurId


      // get limite kit
      let tourneId = compteElectriciteEau.referenceClient
      let tourneSlice = tourneId.slice(0, 7)
      let communeId = compteElectriciteEau.communeClient.toString()
      let tarif = compteElectriciteEau.tarif
      const agence = await prisma.agence.findFirst({
        where:{
          AND:[
            {tourneId : tourneSlice},
            {communeId : parseInt(communeId)}
          ]
        },
      })
      const prix = await prisma.prix.findFirst({
        where: {
          AND: [
            { zoneId: agence.zoneId },
            { tarif: tarif }
          ]
        }
      });
      response[index].CompteElectriciteEau.limitekWh = prix.q1


      // get kitValeurBut
      let kitValeurBut = await prisma.kitValeurBut.findFirst({
        where: {
          kitTongouId: kitTongouId.id
        }
      });

      /**
       * Limite consommation
       */
      response[index].KitTongou.limite = [{
        mois: kitValeurBut.consommationMin,
        jour: kitValeurBut.consommationJour
      }];

      /**
       * get consommation par mois
       **/ 
      dateReleve = compteElectriciteEau.dateReleve;
      if(dateReleve === null) return res.status(400).json({ message: "La date de relevé est obligatoire." });

      response[index].KitTongou.consommationMois = [{
        consommation: 0,
        prix: 0,
        start_mois: "",
        end_mois: ""
      }];


      // get consommation par jour
      response[index].KitTongou.consommationJour = [{
        consommation: 0,
        prix: 0 
      }];

      

      /**
       * get puissance
       */
      response[index].KitTongou.puissance = [{
        code: "cur_power",
        value: "0"
      }];


      /**
       * get courant
       */
      response[index].KitTongou.courant = [{
        code: "cur_current",
        value:"0"
      }];



      /**
       * voltage
       */
      response[index].KitTongou.voltage = [{
        code: "cur_voltage",
        value: "0"
      }];



       /**
       * get lat & long kit
       */
       const weatherKit = await prisma.weatherKit.findFirst({
         where: {
          kitTongouId: kitTongouId.id
         }
       });
       if (weatherKit) {
         response[index].KitTongou.position = [{
           lat: weatherKit.lat,
           lon: weatherKit.lon
         }];
       } else {
        response[index].KitTongou.position = [{
          lat: 0,
          lon: 0
        }];
       }
    }

    res.status(200).json({
      Msg: "Listes de vos kits",
      TotalCount: response.length,
      Data: response,
    });

  } catch (error) {
    res.status(500).json({ messageError: error.message});
  }
};



/**
 * GET ALL KIT PRINCIPALE USER
 */
export const getAllKitPrincipaleUser = async (req, res) => {
  try {
    let utilisateurId = req.body.utilisateurId;
    let response = await prisma.kitTongouUser.findMany({
      where: {
        utilisateurId: parseInt(utilisateurId),
      },
      include: {
        CompteElectriciteEau: true,
        KitTongou: {
          include: {
            KitType: true,    
            KitTypeTongou: true
          }
        },
      },
      orderBy: {
        id: 'asc',
      },
    });

    // response = response.filter(item => {
    //   item.KitTongou.KitType.id === 1 || item.KitTongou.KitType.id === 3
    // });

    const isKitTypeValid = (item) => {
      return item.KitTongou.KitType.id === 1 || item.KitTongou.KitType.id === 3;
    };
    
    response = response.filter(item => isKitTypeValid(item));
    
    let compteExterne = await prisma.kitTongouManyUser.findMany({
      where: {
        AND: [
          { utilisateurId: parseInt(utilisateurId)},
          { valid: true },
          { KitTongou: {
            KitType : {
              id: 1
            }
          }}
        ]
      },

    })
    
    for (let index = 0; index < compteExterne.length; index++) {
      let kitTongouId = compteExterne[index].kitTongouId
      // trouver le compteUser
      let kitExterne = await prisma.kitTongouUser.findFirst({
        where: {
          kitTongouId : kitTongouId
        },
        include: {
          CompteElectriciteEau: true,
          KitTongou: {
            include: {
              KitType: true,    
              KitTypeTongou: true
            }
          },
        },
      })
      response.push(kitExterne);
    }


    for (let index = 0; index < response.length; index++) {
      let device_id = response[index].KitTongou.idKitTongou;
      let KitType = response[index].KitTongou.KitType.type
      let rep_consommation_mois = {}
      let p = {}
      let dateReleve = ""

      // see if kit is offline
      let seeKitOffline =   await functionSeeKitOffline(device_id);
      // console.log("seeKitOffline : ",seeKitOffline);
     
      // get kitTongou
      let kitTongouId = await prisma.kitTongou.findFirst({
        where: {
          idKitTongou: device_id,
        },
      });


      // find typeValeurBut in KitValeurBut
      let KitValeurBut = await prisma.kitValeurBut.findFirst({
        where: {
          kitTongouId: kitTongouId.id
        },
        include: {
          modeGestion: true
        }
      });
      response[index].kwhPersonnaliser = KitValeurBut.typeValeurBut
      response[index].modeGestion = KitValeurBut.modeGestion.mode


      // get kitTongouUser
      let compteElectriciteEauIdKit = await prisma.kitTongouUser.findFirst({
        where: {
          kitTongouId: kitTongouId.id,
        }
      });

      // get compteElectriciteEau
      let compteElectriciteEau = await prisma.compteElectriciteEau.findUnique({
        where: {
          id: parseInt(compteElectriciteEauIdKit.compteElectriciteEauId)
        }
      });
      let utilisateurId = compteElectriciteEau.utilisateurId


      // get limite kit
      let tourneId = compteElectriciteEau.referenceClient
      let tourneSlice = tourneId.slice(0, 7)
      let communeId = compteElectriciteEau.communeClient.toString()
      let tarif = compteElectriciteEau.tarif
      const agence = await prisma.agence.findFirst({
        where:{
          AND:[
            {tourneId : tourneSlice},
            {communeId : parseInt(communeId)}
          ]
        },
      })
      const prix = await prisma.prix.findFirst({
        where: {
          AND: [
            { zoneId: agence.zoneId },
            { tarif: tarif }
          ]
        }
      });
      response[index].CompteElectriciteEau.limitekWh = prix.q1


      // get kitValeurBut
      let kitValeurBut = await prisma.kitValeurBut.findFirst({
        where: {
          kitTongouId: kitTongouId.id
        }
      });

      /**
       * Limite consommation
       */
      response[index].KitTongou.limite = [{
        mois: kitValeurBut.consommationMin,
        jour: kitValeurBut.consommationJour
      }];

      /**
       * get consommation par mois
       **/ 
      dateReleve = compteElectriciteEau.dateReleve;
      if(dateReleve === null) return res.status(400).json({ message: "La date de relevé est obligatoire." });

      rep_consommation_mois = await getConsommationKitTongouMois(device_id, compteElectriciteEau.id, dateReleve);
      response[index].KitTongou.consommationMois = [{
        consommation: rep_consommation_mois.data.consommation,
        prix: rep_consommation_mois.data.prixTTC,
        start_mois: rep_consommation_mois.start_time,
        end_mois: rep_consommation_mois.dateReleve
      }];


      // get consommation par jour
      const todayFormatted = getTodayDateFormatted();
      
      let rep_consommation = await functionGetStatisticsKitTongou(device_id, "add_ele", todayFormatted, todayFormatted, "sum", "days"); 
      
      if(rep_consommation.data){
        const value1Data = rep_consommation.data.result;
        const consommationKWh = Object.values(value1Data)[0]; 
        const prixttt = await CalculTKwhParTranche(compteElectriciteEau.id, consommationKWh)
        const prix = prixttt.data.prixTotalTranche
        response[index].KitTongou.consommationJour = [{
          consommation: consommationKWh,
          prix: prix 
        }];
        await sendMsgIAParJour (utilisateurId, kitTongouId.id, prix, consommationKWh, req.io)
      }else{
        response[index].KitTongou.consommationJour = [];
      }



      

      /**
       * get puissance
       */
      let rep_puissance = await functionGetStatusKitTongou(device_id, "cur_power", req.io); 
      if (rep_puissance.data.result) {
        let puissanceValue = parseFloat(rep_puissance.data.result[0].value) / 10;
        response[index].KitTongou.puissance = [{
          code: rep_puissance.data.result[0].code,
          value: puissanceValue.toFixed(1)  
        }];
      } else {
        response[index].KitTongou.puissance = [];
      }


      /**
       * get courant
       */
      let rep_courant = await functionGetStatusKitTongou(device_id, "cur_current", req.io); 
      if (rep_courant.data.result) {
        let courantValue = parseFloat(rep_courant.data.result[0].value) / 1000;
        response[index].KitTongou.courant = [{
          code: rep_courant.data.result[0].code,
          value: courantValue.toFixed(2)  
        }];
      } else {
        response[index].KitTongou.courant = [];
      }



      /**
       * voltage
       */
      p = await functionGetStatusKitTongou(device_id, "cur_voltage", req.io); 

      if (p.data.result) {
        let voltageValue = parseFloat(p.data.result[0].value) / 10;
        response[index].KitTongou.voltage = [{
          code: p.data.result[0].code,
          value: voltageValue.toFixed(1)  // Garde une décimale
        }];
      } else {
        response[index].KitTongou.voltage = [];
      }



       /**
       * get lat & long kit
       */
       const weatherKit = await prisma.weatherKit.findFirst({
         where: {
          kitTongouId: kitTongouId.id
         }
       });
       if (weatherKit) {
         response[index].KitTongou.position = [{
           lat: weatherKit.lat,
           lon: weatherKit.lon
         }];
       } else {
        response[index].KitTongou.position = [{
          lat: 0,
          lon: 0
        }];
       }
    }

    res.status(200).json({
      Msg: "Listes de vos kits principales",
      TotalCount: response.length,
      Data: response,
    });

  } catch (error) {
    res.status(500).json({ messageError: error.message});
  }
};





/**
 * GET ALL KIT BY COMPTE ELECTRICITE
 */
export const getAllKitTongouByCompteElectriciteId = async (req, res) => {
  try {
    let compteElectriciteEauId = req.body.compteElectriciteEauId

    let response = await prisma.kitTongouUser.findMany({
      where: {
        compteElectriciteEauId: parseInt(compteElectriciteEauId),
      },
      include: {
        CompteElectriciteEau: true,
        KitTongou: {
          include: {
            KitType: true,    
            KitTypeTongou: true
          }
        },
      },
      orderBy: {
        id: 'asc',
      },
    });

    if(response.length === 0){
      return res.status(200).json({
        Msg: `Listes de kit dans le compteur ${response.CompteElectriciteEau.pseudoCompte} ID(${response.CompteElectriciteEau.id})`,
        TotalCount: response.length,
        Data: response,
      });
    }
    

    
    
    let app_tongou = await axios.get(`${port_ecozipo}/getallkittongou`);
    for (let index = 0; index < app_tongou.data.result.length; index++) {
      let kitOnOff = JSON.parse(app_tongou.data.result[index].status[0].value);
      let online = app_tongou.data.result[index].online;
      if(kitOnOff === "true") kitOnOff = true
      else if(kitOnOff === "false") kitOnOff = false
      // console.log("result : ",app_tongou.data.result);
      
      
      let idKit = app_tongou.data.result[index].id;
      let kit = await prisma.kitTongou.findFirst({
        where: {
          idKitTongou: idKit,
        },
      });
      if(kit){
        // console.log(kit.id);
        await prisma.kitTongou.update({
          where: {
            id: kit.id,
          },
          data: {
            online: online,
            kitOnOff: kitOnOff
          },
        });
      }
    }

    response = await prisma.kitTongouUser.findMany({
      where: {
        compteElectriciteEauId: parseInt(compteElectriciteEauId),
      },
      include: {
        CompteElectriciteEau: true,
        KitTongou: {
          include: {
            KitType: true,
            KitTypeTongou: true
          }
        },
      },
      orderBy: {
        id: 'asc',
      },
    });


    for (let index = 0; index < response.length; index++) {
      let device_id = response[index].KitTongou.idKitTongou;
      let rep_consommation_mois = {}
      let p = {}
      let dateReleve = ""

      // see if kit is offline
      let seeKitOffline =   await functionSeeKitOffline(device_id);
      // console.log("seeKitOffline : ",seeKitOffline);
     
      // get kitTongou
      let kitTongouId = await prisma.kitTongou.findFirst({
        where: {
          idKitTongou: device_id,
        },
      });


      // find typeValeurBut in KitValeurBut
      let KitValeurBut = await prisma.kitValeurBut.findFirst({
        where: {
          kitTongouId: kitTongouId.id
        },
        include: {
          modeGestion: true
        }
      });
      response[index].kwhPersonnaliser = KitValeurBut.typeValeurBut
      response[index].modeGestion = KitValeurBut.modeGestion.mode


      // get kitTongouUser
      let compteElectriciteEauIdKit = await prisma.kitTongouUser.findFirst({
        where: {
          kitTongouId: kitTongouId.id,
        }
      });

      // get compteElectriciteEau
      let compteElectriciteEau = await prisma.compteElectriciteEau.findUnique({
        where: {
          id: parseInt(compteElectriciteEauIdKit.compteElectriciteEauId)
        }
      });
      let utilisateurId = compteElectriciteEau.utilisateurId


      // get limite kit
      let tourneId = compteElectriciteEau.referenceClient
      let tourneSlice = tourneId.slice(0, 7)
      let communeId = compteElectriciteEau.communeClient.toString()
      let tarif = compteElectriciteEau.tarif
      const agence = await prisma.agence.findFirst({
        where:{
          AND:[
            {tourneId : tourneSlice},
            {communeId : parseInt(communeId)}
          ]
        },
      })
      const prix = await prisma.prix.findFirst({
        where: {
          AND: [
            { zoneId: agence.zoneId },
            { tarif: tarif }
          ]
        }
      });
      response[index].CompteElectriciteEau.limitekWh = prix.q1


      // get kitValeurBut
      let kitValeurBut = await prisma.kitValeurBut.findFirst({
        where: {
          kitTongouId: kitTongouId.id
        }
      });

      /**
       * Limite consommation
       */
      response[index].KitTongou.limite = [{
        mois: kitValeurBut.consommationMin,
        jour: kitValeurBut.consommationJour
      }];

      /**
       * get consommation par mois
       **/ 
      dateReleve = compteElectriciteEau.dateReleve;
      if(dateReleve === null) return res.status(400).json({ message: "La date de relevé est obligatoire." });

      rep_consommation_mois = await getConsommationKitTongouMois(device_id, compteElectriciteEau.id, dateReleve);
      response[index].KitTongou.consommationMois = [{
        consommation: rep_consommation_mois.data.consommation,
        prix: rep_consommation_mois.data.prixTTC,
        start_mois: rep_consommation_mois.start_time,
        end_mois: rep_consommation_mois.dateReleve
      }];


      // get consommation par jour
      const todayFormatted = getTodayDateFormatted();
      
      let rep_consommation = await functionGetStatisticsKitTongou(device_id, "add_ele", todayFormatted, todayFormatted, "sum", "days"); 
      
      if(rep_consommation.data){
        const value1Data = rep_consommation.data.result;
        const consommationKWh = Object.values(value1Data)[0]; 
        const prixttt = await CalculTKwhParTranche(compteElectriciteEau.id, consommationKWh)
        const prix = prixttt.data.prixTotalTranche
        response[index].KitTongou.consommationJour = [{
          consommation: consommationKWh,
          prix: prix 
        }];
        await sendMsgIAParJour (utilisateurId, kitTongouId.id, prix, consommationKWh, req.io)
      }else{
        response[index].KitTongou.consommationJour = [];
      }

      

      /**
       * get puissance
       */
      let rep_puissance = await functionGetStatusKitTongou(device_id, "cur_power", req.io); 
      if (rep_puissance.data.result) {
        let puissanceValue = parseFloat(rep_puissance.data.result[0].value) / 10;
        response[index].KitTongou.puissance = [{
          code: rep_puissance.data.result[0].code,
          value: puissanceValue.toFixed(1)  
        }];
      } else {
        response[index].KitTongou.puissance = [];
      }


      /**
       * get courant
       */
      let rep_courant = await functionGetStatusKitTongou(device_id, "cur_current", req.io); 
      if (rep_courant.data.result) {
        let courantValue = parseFloat(rep_courant.data.result[0].value) / 1000;
        response[index].KitTongou.courant = [{
          code: rep_courant.data.result[0].code,
          value: courantValue.toFixed(2)  
        }];
      } else {
        response[index].KitTongou.courant = [];
      }



      /**
       * voltage
       */
      p = await functionGetStatusKitTongou(device_id, "cur_voltage", req.io); 

      if (p.data.result) {
        let voltageValue = parseFloat(p.data.result[0].value) / 10;
        response[index].KitTongou.voltage = [{
          code: p.data.result[0].code,
          value: voltageValue.toFixed(1)  // Garde une décimale
        }];
      } else {
        response[index].KitTongou.voltage = [];
      }



       /**
       * get lat & long kit
       */
       const weatherKit = await prisma.weatherKit.findFirst({
         where: {
          kitTongouId: kitTongouId.id
         }
       });
       if (weatherKit) {
         response[index].KitTongou.position = [{
           lat: weatherKit.lat,
           lon: weatherKit.lon
         }];
       } else {
        response[index].KitTongou.position = [{
          lat: 0,
          lon: 0
        }];
       }
    }
    
    res.status(200).json({
      Msg: `Listes de kit dans le compteur ${response[0].CompteElectriciteEau.pseudoCompte} ID(${response[0].CompteElectriciteEau.id})`,
      TotalCount: response.length,
      Data: response,
    });
  } catch (error) {
    res.status(500).json({ messageError: error.message});
  }
};




/**
 * GET ALL KIT TONGOU USER BY GROUPE
 */
export const getAllKitTongouUserByGroupe = async (req, res) => {
  try {
    let { utilisateurId, KitGroupeTongouId, typeRequest } = req.body;
    if(!typeRequest) typeRequest = "fast"
    else typeRequest = "slow"
    
    let response = await prisma.kitTongouUser.findMany({
      where: {
        utilisateurId: parseInt(utilisateurId),
        KitTongou: {
          KitGroupeTongouId: parseInt(KitGroupeTongouId), // Condition sur KitGroupeTongou
        },
      },
      include: {
        CompteElectriciteEau: true,
        KitTongou: {
          include: {
            KitType: true,
            KitGroupeTongou: true,
            KitTypeTongou: true
          },
        },
      },
      orderBy: {
        id: 'asc',
      },
    });

    // trouver tout les kits dans ce groupe
    let findAllKitInGroupe = await prisma.kitTongouUser.findMany({
      where: {
        KitTongou: {
          KitGroupeTongouId: parseInt(KitGroupeTongouId), // Condition sur KitGroupeTongou
        },
      },
      include: {
        CompteElectriciteEau: true,
        KitTongou: {
          include: {
            KitType: true,
            KitGroupeTongou: true,
            KitTypeTongou: true
          },
        },
      },
      orderBy: {
        id: 'asc',
      },
    });
    for (let index = 0; index < findAllKitInGroupe.length; index++) {
      let kitTongouId = findAllKitInGroupe[index].kitTongouId;
      
      let KitLier = await prisma.kitTongouManyUser.findFirst({
        where: {
          AND: [
            { utilisateurId: parseInt(utilisateurId)},
            { kitTongouId: parseInt(kitTongouId) }
          ]
        },
      });
      if(KitLier){
        // trouver le kitTongouUser
        let proprietaireKit = await prisma.kitTongouUser.findFirst({
          where: {
            kitTongouId: KitLier.kitTongouId,
          },
          include: {
            CompteElectriciteEau: true,
            KitTongou: {
              include: {
                KitType: true,
                KitGroupeTongou: true,
                KitTypeTongou: true
              },
            },
          },
          orderBy: {
            id: 'asc',
          },
        });
        response.push({
          ... proprietaireKit
        })
      }
    }
    
    // let app_tongou = await axios.get(`${port_ecozipo}/getallkittongou`);
    // for (let index = 0; index < app_tongou.data.result.length; index++) {
      
      
    //   let kitOnOff = JSON.parse(app_tongou.data.result[index].status[0].value);
    //   let online = app_tongou.data.result[index].online;
    //   if(kitOnOff === "true") kitOnOff = true
    //   else if(kitOnOff === "false") kitOnOff = false
    //   // console.log("result : ",app_tongou.data.result);
      
    //   // console.log("kitOnOff : ",kitOnOff);
    //   // console.log("online : ",online);
      
    //   // console.log("--");
      
    //   let idKit = app_tongou.data.result[index].id;
    //   let kit = await prisma.kitTongou.findFirst({
    //     where: {
    //       idKitTongou: idKit,
    //     },
    //   });
    //   if(kit){
    //     // console.log(kit.id);
    //     await prisma.kitTongou.update({
    //       where: {
    //         id: kit.id,
    //       },
    //       data: {
    //         online: online,
    //         kitOnOff: kitOnOff
    //       },
    //     });
    //   }
    // }

    

    for (let index = 0; index < response.length; index++) {
      let device_id = response[index].KitTongou.idKitTongou;
      let rep_consommation_mois = {}
      let p = {}
      let dateReleve = ""

      // console.log(response[index].KitTongou.pseudo, " : ", response[index].KitTongou.online);

      // see if kit is offline
      await functionSeeKitOffline(device_id);
      // console.log("seeKitOffline : ",seeKitOffline);

      
      // get kitTongou
      let kitTongouId = await prisma.kitTongou.findFirst({
        where: {
          idKitTongou: device_id 
        },
      });

      // find typeValeurBut in KitValeurBut
      let KitValeurBut = await prisma.kitValeurBut.findFirst({
        where: {
          kitTongouId: kitTongouId.id
        },
        include: {
          modeGestion: true
        }
      });
      response[index].kwhPersonnaliser = KitValeurBut.typeValeurBut
      response[index].modeGestion = KitValeurBut.modeGestion.mode


      // get kitTongouUser
      let compteElectriciteEauIdKit = await prisma.kitTongouUser.findFirst({
        where: {
          kitTongouId: kitTongouId.id,
        }
      });

      // get compteElectriciteEau
      let compteElectriciteEau = await prisma.compteElectriciteEau.findUnique({
        where: {
          id: parseInt(compteElectriciteEauIdKit.compteElectriciteEauId)
        }
      });
      let utilisateurId = compteElectriciteEau.utilisateurId


      // get limite kit
      let tourneId = compteElectriciteEau.referenceClient
      let tourneSlice = tourneId.slice(0, 7)
      let communeId = compteElectriciteEau.communeClient.toString()
      let tarif = compteElectriciteEau.tarif
      const agence = await prisma.agence.findFirst({
        where:{
          AND:[
            {tourneId : tourneSlice},
            {communeId : parseInt(communeId)}
          ]
        },
      })
      const prix = await prisma.prix.findFirst({
        where: {
          AND: [
            { zoneId: agence.zoneId },
            { tarif: tarif }
          ]
        }
      });
      response[index].CompteElectriciteEau.limitekWh = prix.q1

      
      // get kitValeurBut
      let kitValeurBut = await prisma.kitValeurBut.findFirst({
        where: {
          kitTongouId: kitTongouId.id
        }
      });

      /**
       * Limite consommation
       */
      response[index].KitTongou.limite = [{
        mois: kitValeurBut.consommationMin,
        jour: kitValeurBut.consommationJour
      }];

      /**
       * get consommation par mois
       **/ 
      dateReleve = compteElectriciteEau.dateReleve;
      if(dateReleve === null) return res.status(400).json({ message: "La date de relevé est obligatoire." });

      if(typeRequest = "fast"){
        response[index].KitTongou.consommationMois = [{
          consommation: 0,
          prix: 0,
          start_mois: "",
          end_mois: ""
        }];
      }else{
        rep_consommation_mois = await getConsommationKitTongouMois(device_id, compteElectriciteEau.id, dateReleve);
        response[index].KitTongou.consommationMois = [{
          consommation: rep_consommation_mois.data.consommation,
          prix: rep_consommation_mois.data.prixTTC, 
          start_mois: rep_consommation_mois.start_time,
          end_mois: rep_consommation_mois.dateReleve
        }];
  
      }
      

      // get consommation par jour
      if(typeRequest = "fast"){
        response[index].KitTongou.consommationJour = [{
          consommation: 0,
          prix: 0 
        }];
      }else{
        const todayFormatted = getTodayDateFormatted()
        let rep_consommation = await functionGetStatisticsKitTongou(device_id, "add_ele", todayFormatted, todayFormatted, "sum", "days"); 
        if(rep_consommation.data){
          const value1Data = rep_consommation.data.result;
          const consommationKWh = Object.values(value1Data)[0]; 
          const prixttt = await CalculTKwhParTranche(compteElectriciteEau.id, consommationKWh)
          const prix = prixttt.data.prixTotalTranche
          response[index].KitTongou.consommationJour = [{
            consommation: consommationKWh,
            prix: prix 
          }];
          await sendMsgIAParJour (utilisateurId, kitTongouId.id, prix, consommationKWh, req.io)
        }else{
          response[index].KitTongou.consommationJour = [];
        }
      }
      



      /**
       * get puissance
       */
      if(typeRequest = "fast"){
        response[index].KitTongou.puissance = [{
          code: "cur_power",
          value: "0"
        }];
      }else{
        let rep_puissance = await functionGetStatusKitTongou(device_id, "cur_power", req.io); 
        if (rep_puissance.data.result) {
          let puissanceValue = parseFloat(rep_puissance.data.result[0].value) / 10;
          response[index].KitTongou.puissance = [{
            code: rep_puissance.data.result[0].code,
            value: puissanceValue.toFixed(1)  
          }];
        } else {
          response[index].KitTongou.puissance = [];
        }
      }


      /**
       * get courant
       */
      if(typeRequest = "fast"){
        response[index].KitTongou.courant = [{
          code: "cur_current",
          value:"0"
        }];
      }else{
        let rep_courant = await functionGetStatusKitTongou(device_id, "cur_current", req.io); 
        if (rep_courant.data.result) {
          let courantValue = parseFloat(rep_courant.data.result[0].value) / 1000;
          response[index].KitTongou.courant = [{
            code: rep_courant.data.result[0].code,
            value: courantValue.toFixed(2)  
          }];
        } else {
          response[index].KitTongou.courant = [];
        }
      }



      /**
       * voltage
       */
      if(typeRequest = "fast"){
        response[index].KitTongou.voltage = [{
          code: "cur_voltage",
          value: "0"
        }];
      }else {
        p = await functionGetStatusKitTongou(device_id, "cur_voltage", req.io); 

        if (p.data.result) {
          let voltageValue = parseFloat(p.data.result[0].value) / 10;
          response[index].KitTongou.voltage = [{
            code: p.data.result[0].code,
            value: voltageValue.toFixed(1)  // Garde une décimale
          }];
        } else {
          response[index].KitTongou.voltage = [];
        }
      }
    }

    res.json({
      Msg: "Listes de vos kits",
      TotalCount: response.length,
      Data: response,
    });

  } catch (error) {
    res.status(500).json({ messageError: error.message, success: false });
    console.log(error.message);
  }
};




/**
 * GET ALL KIT TONGOU USER BY OTHER GROUPE
 */
export const getAllKitTongouUserByOtherGroupe = async (req, res) => {
  try {
    let { utilisateurId, KitGroupeTongouId, typeRequest } = req.body;
    if(!typeRequest) typeRequest = "fast"
    else typeRequest = "slow"

    let response = await prisma.kitTongouUser.findMany({
      where: {
        utilisateurId: parseInt(utilisateurId),
        KitTongou: {
          KitGroupeTongouId: {
            not: parseInt(KitGroupeTongouId) // Exclude KitGroupeTongouId
          },
        },
      },
      include: {
        CompteElectriciteEau: true,
        KitTongou: {
          include: {
            KitType: true,
            KitGroupeTongou: true,
            KitTypeTongou: true
          },
        },
      },
      orderBy: {
        id: 'asc',
      },
    });

    // trouver tout les kits dans ce groupe
    let findAllKitInGroupe = await prisma.kitTongouUser.findMany({
      where: {
        KitTongou: {
          KitGroupeTongouId: parseInt(KitGroupeTongouId), // Condition sur KitGroupeTongou
        },
      },
      include: {
        CompteElectriciteEau: true,
        KitTongou: {
          include: {
            KitType: true,
            KitGroupeTongou: true,
            KitTypeTongou: true
          },
        },
      },
      orderBy: {
        id: 'asc',
      },
    });
    for (let index = 0; index < findAllKitInGroupe.length; index++) {
      let kitTongouId = findAllKitInGroupe[index].kitTongouId;
      
      let KitLier = await prisma.kitTongouManyUser.findFirst({
        where: {
          AND: [
            { utilisateurId: parseInt(utilisateurId)},
            { kitTongouId: parseInt(kitTongouId) }
          ]
        },
      });
      if(KitLier){
        // trouver le kitTongouUser
        let proprietaireKit = await prisma.kitTongouUser.findFirst({
          where: {
            kitTongouId: KitLier.kitTongouId,
          },
          include: {
            CompteElectriciteEau: true,
            KitTongou: {
              include: {
                KitType: true,
                KitGroupeTongou: true,
                KitTypeTongou: true
              },
            },
          },
          orderBy: {
            id: 'asc',
          },
        });
        response.push({
          ... proprietaireKit
        })
      }
    }
    
    // let app_tongou = await axios.get(`${port_ecozipo}/getallkittongou`);
    // for (let index = 0; index < app_tongou.data.result.length; index++) {
      
      
    //   let kitOnOff = JSON.parse(app_tongou.data.result[index].status[0].value);
    //   let online = app_tongou.data.result[index].online;
    //   if(kitOnOff === "true") kitOnOff = true
    //   else if(kitOnOff === "false") kitOnOff = false
    //   // console.log("result : ",app_tongou.data.result);
      
    //   // console.log("kitOnOff : ",kitOnOff);
    //   // console.log("online : ",online);
      
    //   // console.log("--");
      
    //   let idKit = app_tongou.data.result[index].id;
    //   let kit = await prisma.kitTongou.findFirst({
    //     where: {
    //       idKitTongou: idKit,
    //     },
    //   });
    //   if(kit){
    //     // console.log(kit.id);
    //     await prisma.kitTongou.update({
    //       where: {
    //         id: kit.id,
    //       },
    //       data: {
    //         online: online,
    //         kitOnOff: kitOnOff
    //       },
    //     });
    //   }
    // }

    

    for (let index = 0; index < response.length; index++) {
      let device_id = response[index].KitTongou.idKitTongou;
      let rep_consommation_mois = {}
      let p = {}
      let dateReleve = ""

      // console.log(response[index].KitTongou.pseudo, " : ", response[index].KitTongou.online);

      // see if kit is offline
      await functionSeeKitOffline(device_id);
      // console.log("seeKitOffline : ",seeKitOffline);

      
      // get kitTongou
      let kitTongouId = await prisma.kitTongou.findFirst({
        where: {
          idKitTongou: device_id 
        },
      });

      // find typeValeurBut in KitValeurBut
      let KitValeurBut = await prisma.kitValeurBut.findFirst({
        where: {
          kitTongouId: kitTongouId.id
        },
        include: {
          modeGestion: true
        }
      });
      response[index].kwhPersonnaliser = KitValeurBut.typeValeurBut
      response[index].modeGestion = KitValeurBut.modeGestion.mode


      // get kitTongouUser
      let compteElectriciteEauIdKit = await prisma.kitTongouUser.findFirst({
        where: {
          kitTongouId: kitTongouId.id,
        }
      });

      // get compteElectriciteEau
      let compteElectriciteEau = await prisma.compteElectriciteEau.findUnique({
        where: {
          id: parseInt(compteElectriciteEauIdKit.compteElectriciteEauId)
        }
      });
      let utilisateurId = compteElectriciteEau.utilisateurId


      // get limite kit
      let tourneId = compteElectriciteEau.referenceClient
      let tourneSlice = tourneId.slice(0, 7)
      let communeId = compteElectriciteEau.communeClient.toString()
      let tarif = compteElectriciteEau.tarif
      const agence = await prisma.agence.findFirst({
        where:{
          AND:[
            {tourneId : tourneSlice},
            {communeId : parseInt(communeId)}
          ]
        },
      })
      const prix = await prisma.prix.findFirst({
        where: {
          AND: [
            { zoneId: agence.zoneId },
            { tarif: tarif }
          ]
        }
      });
      response[index].CompteElectriciteEau.limitekWh = prix.q1

      
      // get kitValeurBut
      let kitValeurBut = await prisma.kitValeurBut.findFirst({
        where: {
          kitTongouId: kitTongouId.id
        }
      });

      /**
       * Limite consommation
       */
      response[index].KitTongou.limite = [{
        mois: kitValeurBut.consommationMin,
        jour: kitValeurBut.consommationJour
      }];

      /**
       * get consommation par mois
       **/ 
      dateReleve = compteElectriciteEau.dateReleve;
      if(dateReleve === null) return res.status(400).json({ message: "La date de relevé est obligatoire." });

      if(typeRequest = "fast"){
        response[index].KitTongou.consommationMois = [{
          consommation: 0,
          prix: 0,
          start_mois: "",
          end_mois: ""
        }];
      }else{
        rep_consommation_mois = await getConsommationKitTongouMois(device_id, compteElectriciteEau.id, dateReleve);
        response[index].KitTongou.consommationMois = [{
          consommation: rep_consommation_mois.data.consommation,
          prix: rep_consommation_mois.data.prixTTC, 
          start_mois: rep_consommation_mois.start_time,
          end_mois: rep_consommation_mois.dateReleve
        }];
  
      }
      

      // get consommation par jour
      if(typeRequest = "fast"){
        response[index].KitTongou.consommationJour = [{
          consommation: 0,
          prix: 0 
        }];
      }else{
        const todayFormatted = getTodayDateFormatted()
        let rep_consommation = await functionGetStatisticsKitTongou(device_id, "add_ele", todayFormatted, todayFormatted, "sum", "days"); 
        if(rep_consommation.data){
          const value1Data = rep_consommation.data.result;
          const consommationKWh = Object.values(value1Data)[0]; 
          const prixttt = await CalculTKwhEnAriaryTTC(compteElectriciteEau.id, consommationKWh)
          const prix = prixttt.data.prixTotalTranche
          response[index].KitTongou.consommationJour = [{
            consommation: consommationKWh,
            prix: prix 
          }];
          await sendMsgIAParJour (utilisateurId, kitTongouId.id, prix, consommationKWh, req.io)
        }else{
          response[index].KitTongou.consommationJour = [];
        }
      }
      



      /**
       * get puissance
       */
      if(typeRequest = "fast"){
        response[index].KitTongou.puissance = [{
          code: "cur_power",
          value: "0"
        }];
      }else{
        let rep_puissance = await functionGetStatusKitTongou(device_id, "cur_power", req.io); 
        if (rep_puissance.data.result) {
          let puissanceValue = parseFloat(rep_puissance.data.result[0].value) / 10;
          response[index].KitTongou.puissance = [{
            code: rep_puissance.data.result[0].code,
            value: puissanceValue.toFixed(1)  
          }];
        } else {
          response[index].KitTongou.puissance = [];
        }
      }


      /**
       * get courant
       */
      if(typeRequest = "fast"){
        response[index].KitTongou.courant = [{
          code: "cur_current",
          value:"0"
        }];
      }else{
        let rep_courant = await functionGetStatusKitTongou(device_id, "cur_current", req.io); 
        if (rep_courant.data.result) {
          let courantValue = parseFloat(rep_courant.data.result[0].value) / 1000;
          response[index].KitTongou.courant = [{
            code: rep_courant.data.result[0].code,
            value: courantValue.toFixed(2)  
          }];
        } else {
          response[index].KitTongou.courant = [];
        }
      }



      /**
       * voltage
       */
      if(typeRequest = "fast"){
        response[index].KitTongou.voltage = [{
          code: "cur_voltage",
          value: "0"
        }];
      }else {
        p = await functionGetStatusKitTongou(device_id, "cur_voltage", req.io); 

        if (p.data.result) {
          let voltageValue = parseFloat(p.data.result[0].value) / 10;
          response[index].KitTongou.voltage = [{
            code: p.data.result[0].code,
            value: voltageValue.toFixed(1)  // Garde une décimale
          }];
        } else {
          response[index].KitTongou.voltage = [];
        }
      }
    }

    res.json({
      Msg: "Listes de vos kits",
      TotalCount: response.length,
      Data: response,
    });

  } catch (error) {
    res.status(500).json({ messageError: error.message, success: false });
    console.log(error.message);
  }
};







/**
 * GET KIT TONGOU USER BY ID KIT
 */
export const getKitTongouUserByIdKit = async (req, res) => {
  try {
    const idKitTongou = req.body.idKitTongou;
    const compteElectriciteEauId = req.body.compteElectriciteEauId;
    if(!idKitTongou || !compteElectriciteEauId) return res.status(400).json({ message: "Les champs 'idKitTongou' et 'compteElectriciteEauId' sont obligatoires." });

    const compteElectriciteEauExits = await prisma.compteElectriciteEau.findUnique({ 
      where: { id: parseFloat(compteElectriciteEauId) }
    });
    if (!compteElectriciteEauExits) return res.status(400).json({ message: "Le compte électrique n'existe pas." });
    let response = {}
    
    response = await prisma.kitTongou.findFirst({
      where: {
        idKitTongou: idKitTongou,
      },
      include: {
          KitType: true,
          KitTypeTongou: true
      },
    });


    
    if (!response) return res.status(404).json({ 
      Msg: `Kit non trouvé`,
      Data: null,
      success: false
    });


    // trouver si le kit appartient bien au compteElectriciteID
    let ifKitInCompte =  await prisma.kitTongouUser.findFirst({
      where: {
        kitTongouId: response.id,
        compteElectriciteEauId: parseInt(compteElectriciteEauId)
      }
    });
    if(ifKitInCompte === null) return res.status(404).json({ 
      Msg: `Ce kit n'appartient pas à ce compte électricité`,
      Data: null,
      success: false
    });



    // see if kit is offline
    let seeKitOffline =   await functionSeeKitOffline(idKitTongou);
    // console.log("seeKitOffline : ",seeKitOffline);
    

    response = await prisma.kitTongou.findFirst({
      where: {
        idKitTongou: idKitTongou,
      },
      include: {
          KitType: true, 
          KitTypeTongou: true
      },
    });
    

    // find typeValeurBut in KitValeurBut
    const KitValeurBut = await prisma.kitValeurBut.findFirst({
      where: {
        kitTongouId: response.id
      },
      include: {
        modeGestion: true
      }
    });
    
    response.kwhPersonnaliser = KitValeurBut.typeValeurBut
    response.modeGestion = KitValeurBut.modeGestion.mode
    response.dateReleve = compteElectriciteEauExits.dateReleve

    

    let device_id = response.idKitTongou;
    let utilisateurId = compteElectriciteEauExits.utilisateurId

    // get consommation par mois
    const dateReleve = compteElectriciteEauExits.dateReleve;
    if(dateReleve === null) return res.status(400).json({ message: "La date de relevé est obligatoire." });
    let dateNow = new Date();

    let rep_consommation_mois = await getConsommationKitTongouMois(device_id, compteElectriciteEauId, dateReleve, dateNow);
    
    response.consommationMois = [{
      consommation: rep_consommation_mois.data.consommation,
      // consommation: 100,
      prix: rep_consommation_mois.data.prixTTC,
      start_mois: rep_consommation_mois.start_time,
      end_mois: rep_consommation_mois.dateReleve
    }];
  


    // get consommation par jour
    const todayFormatted = getTodayDateFormatted();
    // console.log("todayFormatted : ",todayFormatted);
    
    let rep_consommation = await functionGetStatisticsKitTongou(device_id, "add_ele", todayFormatted, todayFormatted, "sum", "days"); 
    // console.log("rep_consommation : ",rep_consommation.data);
    if(rep_consommation.data){
      const value1Data = rep_consommation.data.result;
      let consommationKWh = Object.values(value1Data)[0]; 
      // calculer le prix du kWh CalculTKwhParTranche
      const prixttt = await CalculTKwhParTranche(compteElectriciteEauId, consommationKWh)
      // console.log("prixttt : ",prixttt);
      const prix = prixttt.data.prixTotalTranche
      response.consommationJour = [{
        consommation: consommationKWh,
        prix: prix
      }];

      // notification IA
      // await sendMsgIAParJour (utilisateurId, response.id, prix, consommationKWh, req.io)
      
      
    }else{
      response.consommationJour = [];
    }


    
  
 

    // get voltage
    let rep_voltage = await functionGetStatusKitTongou(device_id, "cur_voltage", req.io); 
    if (rep_voltage.data.result) {
      let voltageValue = parseFloat(rep_voltage.data.result[0].value) / 10;
      response.voltage = [{
        code: rep_voltage.data.result[0].code,
        value: voltageValue.toFixed(1)  
      }];
    } else {
      response.voltage = [];
    }


    // get puissance
    let rep_puissance = await functionGetStatusKitTongou(device_id, "cur_power", req.io); 
    if (rep_puissance.data.result) {
      let puissanceValue = parseFloat(rep_puissance.data.result[0].value) / 10;
      response.puissance = [{
        code: rep_puissance.data.result[0].code,
        value: puissanceValue.toFixed(1)  
      }];
    } else {
      response.puissance = [];
    }


    /**
     * get courant
     */
    let rep_courant = await functionGetStatusKitTongou(device_id, "cur_current", req.io); 
    if (rep_courant.data.result) {
      let courantValue = parseFloat(rep_courant.data.result[0].value) / 1000;
      response.courant = [{
        code: rep_courant.data.result[0].code,
        value: courantValue.toFixed(2)  
      }];
    } else {
      response.courant = [];
    }


    // get temperature
    let rep_temperature = await functionGetStatusKitTongou(device_id, "temp_value"); 
    if (rep_temperature && rep_temperature.data.result && rep_temperature.data.result.length > 0) {
      response.temperature = rep_temperature.data.result
    } else {
      response.temperature = [];
    }


    /**
       * get lat & long kit
       */
    const weatherKit = await prisma.weatherKit.findFirst({
      where: {
       kitTongouId: response.id
      }
    });
    
    if (weatherKit !== null) {
      response.position = [{
        lat: weatherKit.lat,
        lon: weatherKit.lon
      }];
    } else {
     response.position = [{
       lat: 0,
       lon: 0
     }];
    }

    
    res.status(201).json({
      Msg: `Détail du kit ${response.name}`,
      Data: response,
    });

  } catch (error) {
    res.status(500).json({ messageError: error.message, success: false });
  }
};






export async function getConsommationKitTongouMois(device_id, compteElectriciteEauId, dateReleve, date) {
  try {

    if(!dateReleve){
      dateReleve = new Date()
      dateReleve.setDate(1);
    }

    // console.log("device_id : ",device_id);
    // console.log("compteElectriciteEauId : ",compteElectriciteEauId);
    // console.log("dateReleve : ",dateReleve);
    // console.log("date : ",date);
    
    // find compteElectriciteEau
    const compteElectriciteEau = await prisma.compteElectriciteEau.findUnique({
      where: {
        id: parseInt(compteElectriciteEauId)
      }
    });

    let jourConsommation = 30;
    if(compteElectriciteEau.joursConsommation !== null) jourConsommation = compteElectriciteEau.joursConsommation
    // console.log("dateReleve1 : ",dateReleve);

    // Extraire l'année, le mois et le jour
    const year = parseInt(dateReleve.slice(0, 4));
    const month = parseInt(dateReleve.slice(4, 6)) - 1; // Les mois commencent à 0
    const day = parseInt(dateReleve.slice(6, 8));
    // console.log(`${year}/${month}/${day}`);
    

    const dateObject = new Date(year, month, day);
    dateObject.setDate(dateObject.getDate() + 1); // + 1 jour le commencement du date

    // console.log("dateReleve2 : ",dateObject);
    
    
    // Extraire la date de référence : soit celle fournie, soit la date actuelle
    const referenceDate = date ? new Date(date) : new Date();
    // console.log("referenceDate : ",referenceDate);


    // Liste pour stocker les dates générées
    const generatedDates = [];
    generatedDates.push(new Date(dateObject));
    let supInf = true

    
    // Ajouter 29 jours par mois jusqu'à referenceDate
    if(dateObject < referenceDate){
      supInf = true
      
      while (dateObject < referenceDate) {
        dateObject.setDate(dateObject.getDate() + jourConsommation);
        generatedDates.push(new Date(dateObject));
        // console.log("Nouvelle date après ajout : ", dateObject.toISOString().split("T")[0]);
      }
    }else if(dateObject.getTime() === referenceDate.getTime()){
      supInf = true
      
      
      dateObject.setDate(dateObject.getDate() + jourConsommation);
      generatedDates.push(new Date(dateObject));
    }else{
      supInf = false
      
      
      while (dateObject > referenceDate) {
        dateObject.setDate(dateObject.getDate() - jourConsommation);
        generatedDates.push(new Date(dateObject));
        // console.log("Nouvelle date après ajout : ", dateObject.toISOString().split("T")[0]);
      }
      
    }

   

    
    // console.log("generatedDates : ",generatedDates);
    
    function formatDateToYYYYMMDD(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Ajouter un zéro si nécessaire
      const day = String(date.getDate()).padStart(2, '0'); // Ajouter un zéro si nécessaire
      return `${year}${month}${day}`;
    }

    let start_time = ""
    let end_time = ""

    if(supInf){
      start_time = formatDateToYYYYMMDD(generatedDates[generatedDates.length - 2]);
      end_time = formatDateToYYYYMMDD(generatedDates[generatedDates.length - 1]);
    }else{
      if(generatedDates.length === 2){
        start_time = formatDateToYYYYMMDD(generatedDates[generatedDates.length - 1]);
        end_time = formatDateToYYYYMMDD(generatedDates[generatedDates.length - 2]);
      }else{
        start_time = formatDateToYYYYMMDD(generatedDates[generatedDates.length - 1]);
        end_time = formatDateToYYYYMMDD(generatedDates[generatedDates.length - 2]);
      }
    }

    // console.log("generatedDates : ",generatedDates);



    // let dateEnd = new Date(yearEnd, monthEnd, dayEnd);
    let dateEnd = formatYYYYMMDDtoDate(end_time);
    // console.log("dateEnd : ",dateEnd);
    

    // Décrémenter le jour de 1
    const isSameTime = comparaisonDate();
    if(isSameTime){
      dateEnd.setDate(dateEnd.getDate() - 1); // - 1 pour avoir la valeur du nombre de jour
    }

   

    // Reformater la date au format "YYYYMMDD"
    end_time = dateEnd.toISOString().split("T")[0].replace(/-/g, "").substring(0, 8);
    // console.log("end_time2 : ",end_time);


    // Utiliser `start_time` et `end_time` dans votre appel de fonction
    let rep_consommation_mois = await functionGetStatisticsKitTongou(device_id, "add_ele", start_time, end_time, "sum", "days");
    // console.log("start_time : ",start_time);
    // console.log("end_time : ",end_time);
    
    
    if (rep_consommation_mois.data) {
      const totalConsommation = Object.values(rep_consommation_mois.data.result).reduce((acc, value) => acc + value, 0);
      // console.log(rep_consommation_mois.data.result);
      // console.log("totalConsommation : ",totalConsommation);
      const consommationKWh = totalConsommation.toFixed(2);
      let prix = 0
      let tva = 0
      if(compteElectriciteEauId){
        // trouver si le kit est hybride ou pas
        const kitTongou = await prisma.kitTongou.findFirst({
          where: {
            idKitTongou: device_id
          },
          include: {
            KitType: true
          }
        });
        let status = kitTongou.KitType.type
        // Calculer le prix du kWh
        const prixttt = await CalculTKwhEnAriaryTTC(compteElectriciteEauId, consommationKWh, status, device_id);
        prix = prixttt.data.prixTTC.toFixed(2);
        tva = prixttt.data.tva_
      }


      // format to date start_time
      let nomMois = formatYYYYMMDDtoDate(start_time)
      
      let monthName = new Intl.DateTimeFormat("fr-FR", { month: "long" }).format(nomMois);
     

      return {
        message: `Consommation par mois du kit ${device_id}`,
        data: {
          consommation: parseFloat(consommationKWh),
          prixTTC: parseFloat(prix),
          tva : tva,
          result: rep_consommation_mois.data.result
        },
        mois : monthName,
        annee : nomMois.getFullYear(),
        start_time: start_time,
        dateReleve: end_time,
        success: true
      };
    } else {
      return {
        message: `Consommation par mois du kit ${device_id}`,
        data: {
          consommation: 0,
          prix: 0
        }
      };
    }

  } catch (error) {
    return {
      message: "Erreur lors de la récupération du token",
      error: error.message
    };
  }
};




function formatDates(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}





export async function sendMsgIAParJour (utilisateurId, kitTongouId, prixParJour, consommationKWh, io) {
  try {
    const kitValeurBut = await prisma.kitValeurBut.findFirst({
      where: {
        kitTongouId: parseInt(kitTongouId)
      }
    });
    let consommationLimiteJour = kitValeurBut.consommationJour
    // let consommationLimiteJour = 4
    let tranche1 = consommationLimiteJour / 1.25
    let tranche2 = consommationLimiteJour
    let tranche3 = consommationLimiteJour * 1.25

    // consommationKWh = 8.77
    // console.log("consommationLimiteJour : ",consommationLimiteJour,"kWh")
    // console.log("---------------------------------");
    
    // console.log("kitValeurBut : ",kitValeurBut)

    const utilisateurFind = await prisma.utilisateur.findUnique({
      where: {
        id: utilisateurId
      }
    })
    let statusNotif = utilisateurFind.statusNotif
    

    if(consommationKWh > tranche3){
      if(kitValeurBut.msg3 === false){
        let data = {
          seuil: 3,
          consommationJour: consommationLimiteJour,
          kWhJour: consommationKWh,
          prixParJour:prixParJour
        }
        let analyseIA = await ReponseIAKit(data)
        if (analyseIA.messageError) return res.status(400).json({ messageError: resultElectricite.messageError });  
        console.log("analyseIA.message : ",analyseIA.message)
        await prisma.kitValeurBut.update({
          where: {
            id: kitValeurBut.id
          },
          data: {
            msg1: true,
            msg2: true,
            msg3: true
          }
        })
        // await prisma.notification.create({
        //   data:{
        //       message: analyseIA.message,
        //       type: "alerte",
        //       utilisateurId : utilisateurId,
        //       kitTongouId: kitTongouId
        // }})

        if(statusNotif){
          io.emit('notifLimiteKit', {
            message: analyseIA.message,
            type: "alerte",
            utilisateurId : utilisateurId,
            kitTongouId: kitTongouId
          });
        }
      }
    }
    else if(consommationKWh === tranche2){
      if(kitValeurBut.msg2 === false){
        let data = {
          seuil: 2,
          consommationJour: consommationLimiteJour,
          kWhJour: consommationKWh,
          prixParJour:prixParJour
        }
        let analyseIA = await ReponseIAKit(data)
        if (analyseIA.messageError) return res.status(400).json({ messageError: resultElectricite.messageError });  
        console.log("analyseIA.message : ",analyseIA.message)
        await prisma.kitValeurBut.update({
          where: {
            id: kitValeurBut.id
          },
          data: {
            msg1: true,
            msg2: true
          }
        })
        // await prisma.notification.create({
        //   data:{
        //       message: analyseIA.message,
        //       type: "alerte",
        //       utilisateurId : utilisateurId,
        //       kitTongouId: kitTongouId
        // }})
        
        if(statusNotif){
          io.emit('notifLimiteKit', {
            message: analyseIA.message,
            type: "alerte",
            utilisateurId : utilisateurId,
            kitTongouId: kitTongouId
          });
        }
      }
    }
    else if(consommationKWh > tranche1){
      if(kitValeurBut.msg1 === false){
        let data = {
          seuil: 1,
          consommationJour: consommationLimiteJour,
          kWhJour: consommationKWh,
          prixParJour:prixParJour
        }
        let analyseIA = await ReponseIAKit(data)
        if (analyseIA.messageError) return res.status(400).json({ messageError: resultElectricite.messageError });  
        console.log("analyseIA.message : ",analyseIA.message)
        await prisma.kitValeurBut.update({
          where: {
            id: kitValeurBut.id
          },
          data: {
            msg1: true
          }
        })
        // await prisma.notification.create({
        //   data:{
        //       message: analyseIA.message,
        //       type: "alerte",
        //       utilisateurId : utilisateurId,
        //       kitTongouId: kitTongouId
        // }})
        
        if(statusNotif){
          io.emit('notifLimiteKit', {
            message: analyseIA.message,
            type: "alerte",
            utilisateurId : utilisateurId,
            kitTongouId: kitTongouId
          });
        }
      }
    }

    return{
      message: `Message envoyé`,
      data: []
    };

  } catch (error) {
    return{
      message: "Erreur lors de la récupération du token",
      error: error.message
    };
  }
};



function formatDate(yyyymmdd) {
  const year = yyyymmdd.substring(0, 4);
  const month = yyyymmdd.substring(4, 6);
  const day = yyyymmdd.substring(6, 8);

  return `${day}/${month}/${year}`;
}





/**
 * ADD KIT TONGOU USER
 */
export const addKitTongouUser = async (req, res) => {
  try {
    let kitTongouId = req.body.kitTongouId;
    let { compteElectriciteEauId, modeGestionId, kitTypeId, KitGroupeTongouId } = req.body;

    

    if(!modeGestionId) return res.status(400).json({ message: "Le mode gestion est obligatoire.", success: false });
    if(!compteElectriciteEauId) return res.status(400).json({ message: "Le compte électrique est obligatoire.", success: false });
    if(!kitTypeId) return res.status(400).json({ message: "Le type du kit est obligatoire.", success: false });


    // find compteElectriciteEau User
    const compteUser = await prisma.compteElectriciteEau.findUnique({
      where: {
          id: parseInt(compteElectriciteEauId)
      },
    });
    
    if (!compteUser )  return res.status(404).json({ message: "Compteur introuvable!", success: false });
    let utilisateurId = compteUser.utilisateurId
    if(compteUser.mois1 === null || compteUser.mois2  === null || compteUser.mois3 === null ) return res.status(403).json({ message: "Vous devez ajouter vos consommation de 3 derniers mois!", success: false });
    if(compteUser.dateReleve === null ) return res.status(403).json({ message: "Vous devez ajouter votre date de relevé!", success: false });
    if(compteUser.joursConsommation === null ) return res.status(403).json({ message: "Veuillez ajouter le nombre de jours de votre consommation!", success: false });
    if(compteUser.consommationInitial === null) return res.status(403).json({ message: "Veuillez ajouter votre consommation initial sur votre compteur!", success: false });

    
    // find if kitTypeId exist
    const typeKit = await prisma.kitType.findUnique({
      where: {
        id: parseInt(kitTypeId)
      },
    });
    
    if(!typeKit) return res.status(400).json({ message: "Cette type du disjoncteur n'existe pas", success: false });


    // find modeGestion
    const modeGestionExits = await prisma.modeGestion.findUnique({ 
      where: { id: parseInt(modeGestionId) }
    });
    if(!modeGestionExits) return res.status(404).json({ message: "Le mode gestion n'existe pas.", success: false });

    const kitTongou = await prisma.kitTongou.findFirst({
        where: {
            idKitTongou: kitTongouId
        },
    });
    if (!kitTongou)  return res.status(404).json({ message: "Ce kit n'existe pas!", success: false });
    else if(kitTongou.status === true) return res.status(403).json({ message: "Ce kit est déjà prise!", success: false });

    // si le kit est hybride create kit limite hybride
    let princiapleHybride = false
    if(parseInt(kitTypeId) === 3){
      await prisma.kitTongouLimiteHybride.create({
        data: {
          kitTongouId : kitTongou.id,
          tranche1 : 0,
          tranche2 : 0,
          tranche3 : 0,
          tranche4 : 0,
        }
      });

      // trouver le kit principale est modifié princiapleHybride en true
      let compteurPrincipale = await prisma.kitTongouUser.findFirst({
        where: {
          AND:[
            { compteElectriciteEauId: parseInt(compteElectriciteEauId) },
            { KitTongou: {
              kitTypeId : 1
            }}
          ]
        },
        include:{
          KitTongou:true
        }
      });

      await prisma.kitTongouUser.update({
        where: {
          id: compteurPrincipale.id
        },
        data: {
          princiapleHybride: true
        }
      });


    }

    
    // find si le kit est rattaché à un disjoncteur
    const getKitTongouUserByCompteElectriciteEau = await prisma.kitTongouUser.findMany({
      where: {
        compteElectriciteEauId: parseInt(compteElectriciteEauId)
      }
    });
    // console.log(getKitTongouUserByCompteElectriciteEau.length);
    

    if(getKitTongouUserByCompteElectriciteEau.length > 0 && parseInt(kitTypeId) === 1) return res.status(403).json({ message: "Ce compteur est déjà rattaché par une disjoncteur principale!, vous devez passer par un disjoncteur hybride ou secondaire", success: false });
    if(getKitTongouUserByCompteElectriciteEau.length === 0 && parseInt(kitTypeId) === 2) return res.status(403).json({ message: "Votre disjoncteur devrait être une disjoncteur principale!", success: false });
    
    
 
    // vérifier si le groupe d'utilisateur existe
    if(KitGroupeTongouId){
      const kitGroupeTongou = await prisma.kitGroupeTongou.findFirst({
        where: {
          id: parseInt(KitGroupeTongouId)
        }
      });
      if (!kitGroupeTongou)  return res.status(404).json({ message: "Ce groupe n'existe pas!", success: false });      
    }else{
      KitGroupeTongouId = 1
    }


    /**
     * calcule les trois derniers factures de l'utilisateur
     */
    let calculDernierFacture = await CalculTroisDernierFacture(compteElectriciteEauId, parseInt(modeGestionId));
    if (!calculDernierFacture.success) return res.status(400).json({ message: calculDernierFacture.message, success: false });  
      

    let consommationMin = calculDernierFacture.data.min
    let tranche = calculDernierFacture.data.tranche
    let pourcentageTranche = calculDernierFacture.data.valeurEconomiser.toString()+"%"
    let consommationBut = calculDernierFacture.data.consommationNormal
    let consommationJour = calculDernierFacture.data.consommationJour
    let consommationHeure = calculDernierFacture.data.consommationHeure
        
    // let analyseIA = await ReponseIACreateKitUser(calculDernierFacture.data, modeGestionExits.id);
    // if (analyseIA.messageError) return res.status(400).json({ messageError: analyseIA.messageError });
    // let data = {
    //   pseudoKit : kitTongou.pseudo
    // }
    // let analyseIA = await ReponseIACreateKitUser(data, modeGestionExits.id);
    // if (analyseIA.messageError) return res.status(400).json({ messageError: analyseIA.messageError });


    // trouver si le compte a déjà une date relevé
    if (!compteUser.dateReleve === null )  return res.status(404).json({ message: "Vous devez ajouter votre date de rélevé!", success: false });
    
    // update kit type in kitTongou
      await prisma.kitTongou.update({
      where: {
        id: kitTongou.id
      },
      data: {
        kitTypeId: parseInt(kitTypeId)
      }
    });

    
    // const newNotif = await prisma.notification.create({
    //   data:{
    //       message: `Votre kit ${kitTongou.idKitTongou} est bien ajouté avec succès`,
    //       type: "IA",
    //       utilisateurId : parseInt(compteUser.utilisateurId),
    //       kitTongouId: kitTongou.id
    // }})
    // console.log("newNotif : ",newNotif)
    const utilisateurFind = await prisma.utilisateur.findUnique({
      where: {
        id: utilisateurId
      }
    })
    let statusNotif = utilisateurFind.statusNotif
    // if(statusNotif){
    //   req.io.emit('notifIA', newNotif);
    // }


    /**
     * ajouter kit valeurBut
     */
    await prisma.kitValeurBut.create({
        data: {
          kitTongouId : kitTongou.id,
          status : true,
          consommationMin: consommationMin,
          tranche: tranche,
          pourcentageTranche: pourcentageTranche,
          consommationBut: consommationBut,
          consommationJour: consommationJour,
          consommationHeure: consommationHeure,
          modeGestionId: parseInt(modeGestionId)
        }
    });

    // find user and update premium
    await prisma.utilisateur.update({
      where: {
        id: utilisateurId
      },
      data: {
        typeUserId: 2
      }
    })



    /**
     * ajoute le nouveau kit dans la base de données
     */
    const newKitUser = await prisma.kitTongouUser.create({
    data:{
        utilisateurId: parseInt(utilisateurId),
        kitTongouId: kitTongou.id,
        compteElectriciteEauId: parseInt(compteElectriciteEauId),
        princiapleHybride: false
    }})


    // find if  compteElectriciteEauId rattache disjoncteur
    const getKitTongouUserByCompte = await prisma.kitTongouUser.findMany({
      where: {
        compteElectriciteEauId: parseInt(compteElectriciteEauId)
      }
    });
    if(getKitTongouUserByCompte.length > 0){
      // update compteElectriciteEauId
      await prisma.compteElectriciteEau.update({
        where: {
          id: parseInt(compteElectriciteEauId)
        },
        data: {
          statusDisjoncteur: true
        }
      });
    }


    // update status kit
    await prisma.kitTongou.update({
      where: { id: kitTongou.id },
      data: {
        status: true,
        KitGroupeTongouId: parseInt(KitGroupeTongouId)
      }
    });


    
   


    res.status(201).json({
        message: "Votre kit est bien ajouté dans votre compte",
        data: newKitUser
    });

  } catch (error) {
    console.error("Erreur lors d'ajout du kit tongou user :", error);
    res.status(500).json({
      message: error.message,
      success: false
    });
  }
};



/**
 * DELETE KIT TONGOU USER
 */
export const deleteKitTongouUser = async (req, res) => {
  try {
    let idKitTongou = req.body.idKitTongou;

    const kitTongou = await prisma.kitTongou.findFirst({
      where: {
          idKitTongou: idKitTongou
      },
      include:{
        KitType: true
      }
    });
    if (!kitTongou)  return res.status(404).json({ messageError: "Ce kit n'existe pas!" });
    else if(kitTongou.status === false) return res.status(403).json({ messageError: "Ce kit n'est pas disponible!" });

    /**
     *  delete KitTongouLimiteHybride if kit hybride
     */
    if(kitTongou.KitType.type === "hybride") {
      const kitTongouHyride =  await prisma.kitTongouLimiteHybride.findFirst({
        where: {
          kitTongouId: kitTongou.id
        }
      });

      await prisma.kitTongouLimiteHybride.delete({
        where: {
          id: kitTongouHyride.id
        }
      });
    }



    /**
     * delete kitValeurBut
     */
    const kitValeurBut = await prisma.kitValeurBut.findFirst({
      where: {
        kitTongouId: kitTongou.id
      }
    });
      if(kitValeurBut){
        await prisma.kitValeurBut.delete({
          where: {
            id: kitValeurBut.id
          }
        });
      }

    console.log(`delete kitvaleur ${idKitTongou}`)

    
    /**
     * delete all notification kit
     */
    // await prisma.notification.deleteMany({
    //   where: {
    //     kitTongouId: kitTongou.id
    //   }
    // });

    // console.log(`delete notification ${idKitTongou}`)


    /**
     * delete kit in kittongouuser
     */
    const kitTongouUser = await prisma.kitTongouUser.findFirst({
      where: {
        kitTongouId: kitTongou.id
      }
    });
     if(kitTongouUser){
        await prisma.kitTongouUser.delete({
          where: {
            id: kitTongouUser.id
          }
        });
      }

    console.log(`delete kit user ${idKitTongou}`)

    /**
     * find if  compteElectriciteEauId rattache disjoncteur
     */
    const getKitTongouUserByCompte = await prisma.kitTongouUser.findMany({
      where: {
        compteElectriciteEauId: kitTongouUser.compteElectriciteEauId
      }
    });
    if(getKitTongouUserByCompte.length === 0){
      // update compteElectriciteEauId
      await prisma.compteElectriciteEau.update({
        where: {
          id: kitTongouUser.compteElectriciteEauId
        },
        data: {
          statusDisjoncteur: false
        }
      });
    }
    



    /**
     * delete WeatherKit
     */
      const kitWeatherUser = await prisma.weatherKit.findFirst({
        where: {
          kitTongouId: kitTongou.id
        }
      });
 
      if(kitWeatherUser){
        await prisma.weatherKit.delete({
          where: {
            id: kitWeatherUser.id
          }
        });
      }
      console.log(`delete weather kit ${idKitTongou}`)


      


     /**
      *  update status kit in kit tongou
      */
     
     await prisma.kitTongou.update({
      where: {
        id: kitTongou.id
      },
      data: {
        status: false,
        KitGroupeTongouId: 1
      }
    });

    console.log(`delete kit ${idKitTongou}`)



    


    res.status(201).json({
        message: `Le kit ${kitTongou.name} est bien supprimé de votre compte`,
        data: []
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
      error: error.message
    });
  }
};


/**
 * UPDATE KIT TONGOU USER
 */
export const updateKitTongouUser = async (req, res) => {
  try {
    let { idKitTongou, name, kitTypeId } = req.body;

    const kitTongou = await prisma.kitTongou.findFirst({
      where: {
          idKitTongou: idKitTongou
      },
    });
    if (!kitTongou)  return res.status(404).json({ messageError: "Ce kit n'existe pas!" });
    else if(kitTongou.status === false) return res.status(403).json({ messageError: "Ce kit n'est pas disponible!" });
  
    if(!name) name = kitTongou.name
    if(!kitTypeId) kitTypeId = kitTongou.kitTypeId

    // update kit 
    const updatedKit = await prisma.kitTongou.update({
      where: {
        id: kitTongou.id
      },
      data: {
        name: name,
        kitTypeId: parseInt(kitTypeId)
      }
    });

    res.status(201).json({
        message: `Votre kit ${name} a été à jour`,
        data: updatedKit
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
      error: error.message
    });
  }
};




/**
 * UPDATE KIT TONGOU USER
 */
export const updateCompteElectriciteEauKitUser = async (req, res) => {
  try {
    let { device_id, compteElectriciteEauId } = req.body;


    const kitTongou = await prisma.kitTongou.findFirst({
      where: {
          idKitTongou: device_id
      },
    });
    
    if (!kitTongou)  return res.status(404).json({ messageError: "Ce kit n'existe pas!" });
    else if(kitTongou.status === false) return res.status(403).json({ messageError: "Ce kit n'est pas disponible!" });
  
    // find if compteElectriciteEauId exist
    const compteElectriciteEau = await prisma.compteElectriciteEau.findFirst({
      where: {
        id: parseInt(compteElectriciteEauId)
      }
    });
    if(!compteElectriciteEau) return res.status(404).json({ message: "Le compte électricité n'existe pas.", success: false });
   
    // find kit tongou user
    const kitTongouUser = await prisma.kitTongouUser.findFirst({
      where: {
        kitTongouId: kitTongou.id
      },
    })

    

   // update kit tongou user
    const updatedKit = await prisma.kitTongouUser.update({
      where: {
        id: kitTongouUser.id
      },
      data: {
        compteElectriciteEauId: parseInt(compteElectriciteEauId)
      }
    });

    // update statusDisjoncteur compteElectriciteEauId
    await prisma.compteElectriciteEau.update({
      where: {
        id: parseInt(compteElectriciteEauId)
      },
      data: {
        statusDisjoncteur: true
      }
    });


    res.status(201).json({
        message: `Compte électricité du kit est mis à jour`,
        data: updatedKit
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
      error: error.message
    });
  }
};




/**
 * 
 * 
 * GROUPE
 * 
 */


/**
 * UPDATE GROUPE KIT TONGOU USER
 */
export const updateGroupeUserKitTongou= async (req, res) => {
  try {
    let { device_id, KitGroupeTongouId, utilisateurId } = req.body;
    if(!device_id || !KitGroupeTongouId || !utilisateurId) return res.status(400).json({ message: "Les champs 'device_id', 'KitGroupeTongouId' et 'utilisateurId' sont obligatoires." });

    
    // find kitTongou
    const kitTongou = await prisma.kitTongou.findFirst({
      where: {
          idKitTongou: device_id
      },
    });
    if (!kitTongou)  return res.status(404).json({ message: "Ce kit n'existe pas!", success: false });
    // if(kitTongou.kitTypeId === 1) return res.status(404).json({ message: "On ne peut pas déplacer un kit principale!", success: false });

    // find kitTongouUser
    const kitTongouUser = await prisma.kitTongouUser.findFirst({
      where: {
        kitTongouId: kitTongou.id,
        utilisateurId: parseInt(utilisateurId)
      }
    });
    if (!kitTongouUser)  return res.status(404).json({ message: "Ce kit n'est pas à vous!", success: false });


    // find kitGroupeTongou
    const kitGroupeTongou = await prisma.kitGroupeTongou.findFirst({
      where: {
        id: parseInt(KitGroupeTongouId)
      }
    });
    if (!kitGroupeTongou)  return res.status(404).json({ message: "Ce groupe n'existe pas!", success: false });    

    let groupe = kitGroupeTongou.groupe
    let status = kitGroupeTongou.status
    
    
    if(status === "default" || status === 'customer' && parseInt(utilisateurId) === kitGroupeTongou.utilisateurId) {
      // update groupe kit
      const updatedKit = await prisma.kitTongou.update({
        where: {
          id: kitTongou.id
        },
        data: {
          KitGroupeTongouId: parseInt(KitGroupeTongouId)
        }
      });
      return res.status(201).json({
          message: `Votre kit ${kitTongou.name} a été modifié dans le groupe ${groupe}`,
          data: updatedKit
      });
    }else{
      return res.status(403).json({ message: "Groupe non autorisé!" });
    }

  } catch (error) {
    res.status(500).json({
      message: error.message,
      success: false
    });
  }
};




/**
 * ENLEVER KIT TONGOU IN GROUPE
 */
export const enleverKitTongouInGroupe = async (req, res) => {
  try {
    let { device_id } = req.body;

    // trouver si le kit exist 
    let kitTongouExist = await prisma.kitTongou.findFirst({
      where: {
        idKitTongou: device_id
      },
    });
    if(!kitTongouExist) return res.status(400).json({ message: "Ce kit n'existe pas!", success: false })


    // update KitGroupeTOngouId By default (1)
    kitTongouExist = await prisma.kitTongou.update({
      where: {
        id: kitTongouExist.id
      },
      data: {
        KitGroupeTongouId: 1
      }
    }); 


    return res.status(201).json({
      message: `Votre kit ${kitTongouExist.pseudo} a été enlevé et déplacé dans le groupe par défaut.`,
      data: kitTongouExist,
      success: true
  });

  } catch (error) {
    console.log("Erreur lors l'enlevement du kit dans le groupe par défaut : ", error)
    res.status(500).json({
      message: error.message,
      success: false
    });
  }
};




/**
 * DELETE GROUPE KIT TONGOU USER
 */
export const deleteGroupeUserKitTongou= async (req, res) => {
  try {
    let { KitGroupeTongouId, utilisateurId } = req.body;
    if(!KitGroupeTongouId || !utilisateurId) return res.status(400).json({ message: "Les champs 'device_id', 'KitGroupeTongouId' et 'utilisateurId' sont obligatoires.", success: false });
    
    // find KitGroupeTongou if default groupe
    const KitGroupeTongouDefault = await prisma.kitGroupeTongou.findFirst({
      where: {
        id: parseInt(KitGroupeTongouId)
      },
    });
    if(!KitGroupeTongouDefault) return res.status(400).json({ message: "Ce groupe n'existe pas!", success: false })
    if(KitGroupeTongouDefault.status === 'default') return res.status(400).json({ message: "Vous ne pouvez pas supprimer le groupe par défault.", success: false })
    let nomGroupe = KitGroupeTongouDefault.groupe
    
    // find kitTongou with KitGroupeTongouId
    const kitTongou = await prisma.kitTongou.findMany({
      where: {
        KitGroupeTongouId: parseInt(KitGroupeTongouId)
      },
    });

    for (let index = 0; index < kitTongou.length; index++) {
      let kit = kitTongou[index].id

      // update KitGroupeTOngouId By default (1)
      await prisma.kitTongou.update({
        where: {
          id: kit
        },
        data: {
          KitGroupeTongouId: 1
        }
      }); 
    }

    // delete KitGroupeTongou
    await prisma.kitGroupeTongou.delete({
      where: {
        id: parseInt(KitGroupeTongouId)
      },
    });


    return res.status(201).json({
      message: `Votre groupe ${nomGroupe} a été supprimé.`,
      data: [],
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
 * UPDATE VALEUR KIT HYBRIDE PAR LE KIT PRINCIPALE
 */
export const updateValueKitHybrideByPrincipale = async (req, res) => {
  try {

    // get all kit tongou user
    let compteurPrincipale = await prisma.kitTongouUser.findMany({
      where: {
        princiapleHybride: true
      },
      include:{
        KitTongou:true
      }
    });

    for (let index = 0; index < compteurPrincipale.length; index++) {

        let compteElectriciteEauId = compteurPrincipale[index].compteElectriciteEauId
        let device_id = compteurPrincipale[index].KitTongou.idKitTongou

        /**
         *  trouver le compte Electricite Eau avec le prix et quantite tarif
         */
        const compteElectriciteEau = await prisma.compteElectriciteEau.findUnique({
          where: {
            id : compteElectriciteEauId
          }
        });
        let zoneId = compteElectriciteEau.zoneId
        let tarif = compteElectriciteEau.tarif
        let dateReleve = compteElectriciteEau.dateReleve
        let dateNow = new Date();
        
        const prix = await prisma.prix.findFirst({
          where: {
            AND: [
              { zoneId: zoneId },
              { tarif: tarif }
            ]
          }
        });

        let  quantiteParTranche = {
          1 : prix.q1,
          2 : prix.q2,
          3 : prix.q3,
          4 : prix.q4
        }


        let rep_consommation_mois = await getConsommationKitTongouMois(device_id, compteElectriciteEauId, dateReleve, dateNow);
        // console.log("rep_consommation_mois : ",rep_consommation_mois);
        // let consommationPrincipale = rep_consommation_mois.data.consommation
        // console.log("principale : ",device_id, ", kwh : ",consommationPrincipale);
       let consommationPrincipale = 135
       console.log("quantiteParTranche : ",quantiteParTranche);

        if(consommationPrincipale >= quantiteParTranche[1] && consommationPrincipale <= quantiteParTranche[2]){
          // 2e tranche declancher
          console.log("2e tranche ");
          let compteurHybride = await prisma.kitTongouUser.findMany({
            where: {
              AND:[
                { compteElectriciteEauId: parseInt(compteElectriciteEauId) },
                { KitTongou: {
                  kitTypeId : 3
                }}
              ]
            }, include:{
              KitTongou:true
            }
          });
         
          for (let index = 0; index < compteurHybride.length; index++) {
            let kitTongouId = compteurHybride[index].kitTongouId
            device_id = compteurHybride[index].KitTongou.idKitTongou
            rep_consommation_mois = await getConsommationKitTongouMois(device_id, compteElectriciteEauId, dateReleve, dateNow);
            let consommationHybride = rep_consommation_mois.data.consommation

            // update KitTongouLimiteHybride
            let valueHybride = await prisma.kitTongouLimiteHybride.findFirst({
              where: {
                kitTongouId: kitTongouId
              },
            });
            
            if(valueHybride.tranche1 === 0){
              console.log("manao update");
              await prisma.kitTongouLimiteHybride.update({
                where: {
                  id: valueHybride.id
                },
                data: {
                  tranche1: consommationHybride
                }
              });
            }
           
            
          }

        
        }else if(consommationPrincipale >= quantiteParTranche[2] && consommationPrincipale <= quantiteParTranche[3]){
          // 3e tranche declancher
          console.log("3e tranche");
          let compteurHybride = await prisma.kitTongouUser.findMany({
            where: {
              AND:[
                { compteElectriciteEauId: parseInt(compteElectriciteEauId) },
                { KitTongou: {
                  kitTypeId : 3
                }}
              ]
            }, include:{
              KitTongou:true
            }
          });
         
          for (let index = 0; index < compteurHybride.length; index++) {
            let kitTongouId = compteurHybride[index].kitTongouId
            device_id = compteurHybride[index].KitTongou.idKitTongou
            rep_consommation_mois = await getConsommationKitTongouMois(device_id, compteElectriciteEauId, dateReleve, dateNow);
            let consommationHybride = rep_consommation_mois.data.consommation

             // update KitTongouLimiteHybride
             let valueHybride = await prisma.kitTongouLimiteHybride.findFirst({
                where: {
                  kitTongouId: kitTongouId
                },
              });

              if(valueHybride.tranche2 === 0){
                console.log("manao update");
                await prisma.kitTongouLimiteHybride.update({
                  where: {
                    id: valueHybride.id
                  },
                  data: {
                    tranche2: consommationHybride
                  }
                });
              }

              
          }
        
        }else {
          console.log("mbole 1er tranche");
          let compteurHybride = await prisma.kitTongouUser.findMany({
            where: {
              AND:[
                { compteElectriciteEauId: parseInt(compteElectriciteEauId) },
                { KitTongou: {
                  kitTypeId : 3
                }}
              ]
            }, include:{
              KitTongou:true
            }
          });

         
          for (let index = 0; index < compteurHybride.length; index++) {
            let kitTongouId = compteurHybride[index].kitTongouId

            // update KitTongouLimiteHybride
            let valueHybride = await prisma.kitTongouLimiteHybride.findFirst({
              where: {
                kitTongouId: kitTongouId
              },
            });

            await prisma.kitTongouLimiteHybride.update({
              where: {
                id: valueHybride.id
              },
              data: {
                tranche1: 0,
                tranche2: 0,
                tranche3: 0,
                tranche4: 0
              }
            });
            
          }

        }
       
    }


    res.status(201).json({
        message: "Les kits principales qui ont des kits hybride",
        length : compteurPrincipale.length,
        data: compteurPrincipale
    });

  } catch (error) {
    console.error("Erreur lors d'ajout du kit tongou user :", error);
    res.status(500).json({
      message: error.message,
      success: false
    });
  }
};

export async function functionupdateValueKitHybrideByPrincipale () {
  try {

    // get all kit tongou user
    let compteurPrincipale = await prisma.kitTongouUser.findMany({
      where: {
        princiapleHybride: true
      },
      include:{
        KitTongou:true
      }
    });


    for (let index = 0; index < compteurPrincipale.length; index++) {

        let compteElectriciteEauId = compteurPrincipale[index].compteElectriciteEauId
        let device_id = compteurPrincipale[index].KitTongou.idKitTongou

        /**
         *  trouver le compte Electricite Eau avec le prix et quantite tarif
         */
        const compteElectriciteEau = await prisma.compteElectriciteEau.findUnique({
          where: {
            id : compteElectriciteEauId
          }
        });
        let zoneId = compteElectriciteEau.zoneId
        let tarif = compteElectriciteEau.tarif
        let dateReleve = compteElectriciteEau.dateReleve
        let dateNow = new Date();
        
        const prix = await prisma.prix.findFirst({
          where: {
            AND: [
              { zoneId: zoneId },
              { tarif: tarif }
            ]
          }
        });

        let  quantiteParTranche = {
          1 : prix.q1,
          2 : prix.q2,
          3 : prix.q3,
          4 : prix.q4
        }


        let rep_consommation_mois = await getConsommationKitTongouMois(device_id, compteElectriciteEauId, dateReleve, dateNow);
        let consommationPrincipale = rep_consommation_mois.data.consommation
        // console.log("principale : ",device_id, ", kwh : ",consommationPrincipale);
      //  let consommationPrincipale = 135
      //  console.log("quantiteParTranche : ",quantiteParTranche);

        if(consommationPrincipale >= quantiteParTranche[1] && consommationPrincipale <= quantiteParTranche[2]){
          // 2e tranche declancher
         
          let compteurHybride = await prisma.kitTongouUser.findMany({
            where: {
              AND:[
                { compteElectriciteEauId: parseInt(compteElectriciteEauId) },
                { KitTongou: {
                  kitTypeId : 3
                }}
              ]
            }, include:{
              KitTongou:true
            }
          });
         
          for (let index = 0; index < compteurHybride.length; index++) {
            let kitTongouId = compteurHybride[index].kitTongouId
            device_id = compteurHybride[index].KitTongou.idKitTongou
            rep_consommation_mois = await getConsommationKitTongouMois(device_id, compteElectriciteEauId, dateReleve, dateNow);
            let consommationHybride = rep_consommation_mois.data.consommation

            // update KitTongouLimiteHybride
            let valueHybride = await prisma.kitTongouLimiteHybride.findFirst({
              where: {
                kitTongouId: kitTongouId
              },
            });
            
            if(valueHybride.tranche1 === 0){
              console.log("2e tranche ");
              await prisma.kitTongouLimiteHybride.update({
                where: {
                  id: valueHybride.id
                },
                data: {
                  tranche1: consommationHybride
                }
              });
            }
           
            
          }

        
        }else if(consommationPrincipale >= quantiteParTranche[2] && consommationPrincipale <= quantiteParTranche[3]){
          // 3e tranche declancher
          
          let compteurHybride = await prisma.kitTongouUser.findMany({
            where: {
              AND:[
                { compteElectriciteEauId: parseInt(compteElectriciteEauId) },
                { KitTongou: {
                  kitTypeId : 3
                }}
              ]
            }, include:{
              KitTongou:true
            }
          });
         
          for (let index = 0; index < compteurHybride.length; index++) {
            let kitTongouId = compteurHybride[index].kitTongouId
            device_id = compteurHybride[index].KitTongou.idKitTongou
            rep_consommation_mois = await getConsommationKitTongouMois(device_id, compteElectriciteEauId, dateReleve, dateNow);
            let consommationHybride = rep_consommation_mois.data.consommation

             // update KitTongouLimiteHybride
             let valueHybride = await prisma.kitTongouLimiteHybride.findFirst({
                where: {
                  kitTongouId: kitTongouId
                },
              });

              if(valueHybride.tranche2 === 0){
                console.log("3e tranche");
                await prisma.kitTongouLimiteHybride.update({
                  where: {
                    id: valueHybride.id
                  },
                  data: {
                    tranche2: consommationHybride
                  }
                });
              }

              
          }
        
        }else {
          // console.log("mbole 1er tranche");
          let compteurHybride = await prisma.kitTongouUser.findMany({
            where: {
              AND:[
                { compteElectriciteEauId: parseInt(compteElectriciteEauId) },
                { KitTongou: {
                  kitTypeId : 3
                }}
              ]
            }, include:{
              KitTongou:true
            }
          });

         
          for (let index = 0; index < compteurHybride.length; index++) {
            let kitTongouId = compteurHybride[index].kitTongouId

            // update KitTongouLimiteHybride
            let valueHybride = await prisma.kitTongouLimiteHybride.findFirst({
              where: {
                kitTongouId: kitTongouId
              },
            });

            await prisma.kitTongouLimiteHybride.update({
              where: {
                id: valueHybride.id
              },
              data: {
                tranche1: 0,
                tranche2: 0,
                tranche3: 0,
                tranche4: 0
              }
            });
            
          }

        }
       
    }

    console.log("update Limite kit hybride");
    // res.status(201).json({
    //     message: "Les kits principales qui ont des kits hybride",
    //     length : compteurPrincipale.length,
    //     data: compteurPrincipale
    // });

  } catch (error) {
    console.error("Erreur lors de mise à jour limite hybride :", error);
  }
};





/**
 * GET STATISTICS KIT BY DAYS
 */
export const getStatisticsKitByDay = async (req, res) => {
  try {
    const { device_id, date, compteElectriciteEauId } = req.body;

    if (!device_id || !compteElectriciteEauId) {
      return res.status(400).json({ message: "Les champs 'device_id' et 'compteElectriciteEauId' sont obligatoires." });
    }

    if (!date) {
      return res.status(400).json({ message: "La date est obligatoire." });
    }

    const givenDate = new Date(date);
    if (isNaN(givenDate)) {
      return res.status(400).json({ message: "La date fournie n'est pas valide." });
    }

    const year = givenDate.getFullYear();
    const month = String(givenDate.getMonth() + 1).padStart(2, '0'); 
    const day = String(givenDate.getDate()).padStart(2, '0'); 

    const start_time = `${year}${month}${day}00`;
    const end_time = `${year}${month}${day}23`; 




    const compteElectriciteEauExits = await prisma.compteElectriciteEau.findUnique({ 
      where: { id: parseFloat(compteElectriciteEauId) }
    });
    if (!compteElectriciteEauExits) return res.status(400).json({ message: "Le compte électrique n'existe pas." });

  
    const code = "add_ele"
    const stat_type = "sum"
    const time_type = "hours"

    let isValid = false;
    let response = {};
    let retries = 0;

    while (!isValid && retries < 3) {
      let tokens = getTokens();

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

      // console.log("start_time : ",start_time);
      // console.log("end_time : ",end_time);
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

    if(isValid){
      let consommationTotal = 0
      let prixTotal = 0

      const rawResult = response.data.result;
      // console.log("rawResult : ",rawResult);
      const entries = rawResult.slice(1, -1).split(', ');
      const resultFormatted = {};
    
      let rep_consommation_mois = await getConsommationKitTongouMois(device_id, compteElectriciteEauExits.id, compteElectriciteEauExits.dateReleve, date);
      let prixIndiceTranche = 1
      if (rep_consommation_mois.success) {
        let dateReference = `${year}${month}${day}`
        const result = rep_consommation_mois.data.result;
        let KwhMoisReference = 0
        for (const key in result) {
          let keyValue = key;
          let consommationKwh = result[key];
          KwhMoisReference = KwhMoisReference + consommationKwh
  
          let prixttc = {}
          let prix = 0
          let indiceTranche = 0
         
          prixttc = await CalculKwhTrancheParGraph(compteElectriciteEauId, consommationKwh, KwhMoisReference);
          prix = prixttc.data.prixTotalTranche;
          indiceTranche = prixttc.data.indiceTranche

          if(dateReference === keyValue){
            prixIndiceTranche = indiceTranche 
          }
        }   
      }else {
          return res.status(400).json({ message: rep_consommation_mois.error, success: false });
      }
      // console.log("prixIndiceTranche : ",prixIndiceTranche);

      for (const [index, entry] of entries.entries()) {
        const [, value] = entry.split('=');
    
        // Calculer la consommation et le prix CalculTKwhParTranche
        let consommationKwh = parseFloat(value);
        let prixttc = await CalculKwhParIndiceTranche(compteElectriciteEauId, consommationKwh, prixIndiceTranche);
        // console.log("prixttc : ",prixttc.data);
        let prix = prixttc.data.prixTotalTranche;
    
        const key = `h_${index + 1}`;
        resultFormatted[key] = {
          consommation: consommationKwh,
          prix: prix
        }; 
        consommationTotal = consommationTotal + consommationKwh
        prixTotal = prixTotal + prix
      }
    
      return res.status(201).json({
        message: `Statistiques de votre consommation par jour`,
        data: {
          result: resultFormatted,
          success: response.data.success,
          consommation: parseFloat(consommationTotal.toFixed(2)),
          prix: parseFloat(prixTotal.toFixed(2)),
          t: response.data.t,
          tid: response.data.tid
        }
      });

    } else {
      return res
        .status(400)
        .json({ messageError: "Impossible de récupérer les données après plusieurs tentatives." });
    }
    
    
    
    

  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la récupération du token",
      error: error.message
    });
  }
};


export const getStatisticsKitBy7LastDays = async (req, res) => {
  try {
    const { device_id, date, compteElectriciteEauId } = req.body;

    if (!device_id || !compteElectriciteEauId) {
      return res.status(400).json({ message: "Les champs 'device_id' et 'compteElectriciteEauId' sont obligatoires." });
    }
    
    // Utiliser la date actuelle si aucune date n'est fournie
    const givenDate = date ? new Date(date) : new Date();
    if (isNaN(givenDate)) {
      return res.status(400).json({ message: "La date fournie n'est pas valide." });
    }
    
    const endDate = new Date(givenDate); 
    let startDate = new Date(givenDate);
    
    let data = {}
    let consommationTotal = 0
    for (let index = 6; index >= 0; index--) {
      startDate.setDate(endDate.getDate() - index);
      let dateFormat = formatDateYYYYMMDD(startDate)
      let rep_consommation = await functionGetStatisticsKitTongou(device_id, "add_ele", dateFormat, dateFormat, "sum", "days"); 
      let consommationKwh = rep_consommation.data.result[dateFormat]
      consommationTotal = consommationTotal + consommationKwh
      let prixTranche = await CalculTKwhEnAriaryTTC(compteElectriciteEauId, consommationKwh)
      data[dateFormat] = [{
        consommation : rep_consommation.data.result[dateFormat],
        prixTranche : prixTranche.data.prixTotalTranche
      }]
    }
    let prixTTCs = 0
    let calculprixTTC = await CalculTKwhEnAriaryTTC(compteElectriciteEauId, consommationTotal)
    prixTTCs = calculprixTTC.data.prixTTC

    return res.status(201).json({
      message: `Statistiques de votre consommation de 7 derniers jours`,
      data: {
        result: data,
        success: true,
        consommation: parseFloat(consommationTotal.toFixed(2)),
        prixTTC: parseFloat(prixTTCs.toFixed(2))
      }
    });  

  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la récupération du token",
      error: error.message
    });
  }
};



export const getStatisticsKitByMois = async (req, res) => {
  try {
    const { device_id, date, compteElectriciteEauId } = req.body;


    if (!device_id || !compteElectriciteEauId) return res.status(400).json({ message: "Les champs 'device_id' et 'compteElectriciteEauId' sont obligatoires." });


    const compteElectriciteEauExits = await prisma.compteElectriciteEau.findUnique({ 
      where: { id: parseFloat(compteElectriciteEauId) }
    });
    if (!compteElectriciteEauExits) return res.status(400).json({ message: "Le compte électrique n'existe pas.", success: false });


    // get consommation par mois
    const dateReleve = compteElectriciteEauExits.dateReleve;
    let rep_consommation_mois;
    if(dateReleve === null) return res.status(400).json({ message: "La date de relevé est obligatoire.", success: false });
    // console.log("date : ",date);
    
    rep_consommation_mois = await getConsommationKitTongouMois(device_id, compteElectriciteEauExits.id, dateReleve, date);

    let resultFormatted = {}
    if (rep_consommation_mois.success) {
      const result = rep_consommation_mois.data.result;
      let KwhMoisReference = 0
      for (const key in result) {
        let keyValue = key;
        let consommationKwh = result[key];
        KwhMoisReference = KwhMoisReference + consommationKwh

        let prixttc = {}
        let prix = 0
        let indiceTranche = 0
       
        prixttc = await CalculKwhTrancheParGraph(compteElectriciteEauId, consommationKwh, KwhMoisReference);
        prix = prixttc.data.prixTotalTranche;
        indiceTranche = prixttc.data.indiceTranche

        resultFormatted[keyValue] = {
          consommation: consommationKwh,
          prix: prix,
          indiceTranche: indiceTranche
        };
      }
      
      rep_consommation_mois.data.result = resultFormatted;
      return res.status(201).json(rep_consommation_mois);
    }else {
        return res.status(400).json({ message: rep_consommation_mois.error, success: false });
    }
   
  } catch (error) {
    res.status(500).json({
      message: error,
      success: false
    });
  }
};



export const getStatisticsKitByYears = async (req, res) => {
 
try {
  const { device_id, years, compteElectriciteEauId, date } = req.body;

  if (!device_id || !compteElectriciteEauId)
    return res.status(400).json({ message: "Les champs 'device_id' et 'compteElectriciteEauId' sont obligatoires." });

  if (!years || isNaN(years)) {
    return res.status(400).json({ message: "L'année (years) est obligatoire et doit être un nombre valide." });
  }

  const compteElectriciteEauExits = await prisma.compteElectriciteEau.findUnique({
    where: { id: parseFloat(compteElectriciteEauId) }
  });
  if (!compteElectriciteEauExits)
    return res.status(400).json({ message: "Le compte électrique n'existe pas." });

  const dateReleve = compteElectriciteEauExits.dateReleve;
  if (!dateReleve) return res.status(400).json({ message: "La date de relevé est obligatoire.", success: false });

  // Initialiser les statistiques mensuelles
  const mois = [
    "jan", "fev", "mars", "avr", "mai", "juin",
    "juil", "aou", "sep", "oct", "nov", "dec"
  ];
  const result = {};

  // Convertir la date de relevé en objet Date
  const startDate = new Date(`${years}-01-05`); // Début de l'année

  // Boucler sur chaque mois
  for (let i = 0; i < 12; i++) {
    const dateReleveMois = new Date(startDate);
    dateReleveMois.setMonth(i); // Ajuster le mois

    
    
    const dateReleveFormatted = `${dateReleveMois.getMonth() + 1}/${dateReleveMois.getDate()}/${dateReleveMois.getFullYear()}`;

    const rep_consommation_mois = await getConsommationKitTongouMois(
      device_id,
      compteElectriciteEauExits.id,
      dateReleve,
      dateReleveFormatted
    );
    if (rep_consommation_mois.success) {
      const consommation = rep_consommation_mois.data.consommation || 0;
      const prix = consommation === 0 ? 0 : rep_consommation_mois.data.prixTTC || 0;
      const start_time = rep_consommation_mois.start_time;
      const dateReleve = rep_consommation_mois.dateReleve;

      
  
      result[mois[i]] = {
        consommation,
        prixTTC: prix,
        start_time,
        dateReleve
      };
    } else {
      result[mois[i]] = {
        consommation: 0,
        prixTTC: 0
      };
    }
  }

  

  // Réponse finale
  return res.status(200).json({
    message: `Statistiques de votre consommation en ${years}`,
    data: { 
      result, 
      success: true 
    }
  });

} catch (error) {
  res.status(500).json({
    message: error.message,
    success: false
  });
}
};





export const getStatisticsKitByMoisSpecifique = async (req, res) => {
  try {
    let { device_id, start_time, end_time } = req.body;


    if (!device_id) return res.status(400).json({ message: "Le champs 'device_id' est obligatoire." });

    // trouver le kit
    let kitTongouUser = await prisma.kitTongouUser.findFirst({
      where: {
        KitTongou:{
          idKitTongou: device_id
        }
      },
      include: {
        KitTongou: {
          include: {
            KitType: true
          }
        },
        CompteElectriciteEau: true
      }
    });
    if(!kitTongouUser) return res.status(400).json({ message: "Ce kit n'existe pas!", success: false })

    let dateDebut = new Date(start_time)
    let dateFin = new Date(end_time)
    const differenceEnMs = dateFin - dateDebut;
    const differenceEnJours = differenceEnMs / (1000 * 60 * 60 * 24);
    if(differenceEnJours<28 || differenceEnJours >35) return res.status(400).json({ message: "Le nombre de jours devrait être compris entre 28 et 35 jours", success: false })


    start_time = formatDateYYYYMMDD(new Date(start_time))
    end_time =  formatDateYYYYMMDD(new Date(end_time))
    let compteElectriciteEauId = kitTongouUser.compteElectriciteEauId
    let dateReleve = kitTongouUser.CompteElectriciteEau.dateReleve
    let joursConsommation = kitTongouUser.CompteElectriciteEau.joursConsommation

    let year = parseInt(dateReleve.slice(0, 4));
    let month = parseInt(dateReleve.slice(4, 6)) - 1; // Les mois commencent à 0
    let day = parseInt(dateReleve.slice(6, 8));

    let start_releve = new Date(year, month, day);
    let date_reference = new Date(year, month, day);
    let end_releve = new Date( date_reference.setDate(date_reference.getDate() + joursConsommation))

    // console.log("start_releve : ", start_releve);
    // console.log("end_releve : ", end_releve);

    // console.log("device_id : ",device_id);
    // console.log("start_time : ",start_time);
    // console.log("end_time : ",end_time);
    
    let rep_consommation_mois = await functionGetStatisticsKitTongou(device_id, "add_ele", start_time, end_time, "sum", "days");
    // console.log(rep_consommation_mois.data);
    


    if (rep_consommation_mois.data) {
      const totalConsommation = Object.values(rep_consommation_mois.data.result).reduce((acc, value) => acc + value, 0);
      const consommationKWh = totalConsommation.toFixed(2);
      let prix = 0
      let tva = 0

      if(compteElectriciteEauId){
        
        // trouver si le kit est hybride ou pas
        let status = kitTongouUser.KitTongou.KitType.type
        // Calculer le prix du kWh
        const prixttt = await CalculTKwhEnAriaryTTC(compteElectriciteEauId, consommationKWh, status, device_id);
        // console.log("prixttt : ",prixttt);
        prix = prixttt.data.prixTTC.toFixed(2);
        tva = prixttt.data.tva_
      }

      // console.log("eto");
      

      // format to date start_time
      let nomMois = formatYYYYMMDDtoDate(start_time)
      
      let monthName = new Intl.DateTimeFormat("fr-FR", { month: "long" }).format(nomMois);
     
      let resultFormatted = {}
      const result = rep_consommation_mois.data.result;
      let KwhMoisReference = 0
      for (const key in result) {
        let keyValue = key;
        let consommationKwh = result[key];
        KwhMoisReference = KwhMoisReference + consommationKwh

        let prixttc = {}
        let prix = 0
        let indiceTranche = 0
       
        prixttc = await CalculKwhTrancheParGraph(compteElectriciteEauId, consommationKwh, KwhMoisReference);
        prix = prixttc.data.prixTotalTranche;
        indiceTranche = prixttc.data.indiceTranche

        resultFormatted[keyValue] = {
          consommation: consommationKwh,
          prix: prix,
          indiceTranche: indiceTranche
        };
      }
      
      rep_consommation_mois.data.result = resultFormatted;


      res.status(200).json({
        message: `Consommation par mois du kit ${device_id}`,
        data: {
          consommation: parseFloat(consommationKWh),
          prixTTC: parseFloat(prix),
          tva : tva,
          result: rep_consommation_mois.data.result
        },
        mois : monthName,
        annee : nomMois.getFullYear(),
        start_time: start_time,
        dateReleve: end_time,
        success: true
      })

    } else {
      res.status(200).json({
        message: `Consommation par mois du kit ${device_id}`,
        data: {
          consommation: 0,
          prix: 0
        },
        success: true
      })
    
    }
   
  } catch (error) {
    res.status(500).json({
      message: error.message,
      success: false
    });
  }
};





export const formatDateYYYYMMDD = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); 
  const day = String(date.getDate()).padStart(2, '0'); 
  return `${year}${month}${day}`;
};


