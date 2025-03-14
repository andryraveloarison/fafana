import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv';
import axios from 'axios'
import { getTokens } from '../../utils/tokenStore.js';
import { GenerateSign } from '../ConfigController.js';
import { formatYYYYMMDDtoDate } from './KitTongouAutoReleveController.js';
import { formatDateToYYYYMMDD } from '../Electricite/AutoReleveController.js';
import { formatYYYYMMDDtoDateAndHours } from '../FunctionDate.js';

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
const port_ia = process.env.PORT_IA;
const port_analyse= process.env.PORT_ANALYSE;


/***
 * 
 * send notification surconsommation week
 */
export const sendNotificationSurconsommationWeek = async (req, res) => {
  try {
    const { utilisateurId, message, titre, start_time, end_time } = req.body;  

    if(utilisateurId && message && titre){
      let analyse = await prisma.analyseia.create({
        data: {
          titre: titre,
          analyse: message,
          utilisateurId: parseInt(utilisateurId),
          start_time: start_time,
          end_time : end_time
        }
      })

      await prisma.notification.create({
        data: {
          titre: titre,
          description: message,
          analyseaiId: analyseaiId.id,
          type: "ia",
          isSonor: true,
          isTouched: true,
          utilisateurId: parseInt(utilisateurId),
        }
      })

      req.io.emit('notifSurconsommationIA', {
        titre: titre,
        message: message,
        utilisateurId : parseInt(utilisateurId),
        analyseaiId : analyse.id,
        type: "ia",
        isSonor: true,
        isTouched: true,
      });
  
      console.log("analyse : ",analyse);


    }else {
      console.log("tsisy donnée");
    }
   

    return res.status(201).json({
      message: message,
      utilisateurId: utilisateurId,
      success: true
    });

  } catch (error) {
    console.error("Erreur lors de l'envoi de la notification par semaine", error);
    res.status(500).json({
      message: "Erreur lors de l'envoi de la notification par semaine",
      error: error.message,
      success: false
    });
  }
};





/***
 * 
 * Detecter surconsommation by week
 */
export const detectSurconsommationWeek = async (req, res) => {
  try {
    const { device_id,  date } = req.body;
    let today = new Date()

    if(date) today = new Date(date)
    let lastWeek = getLastWeek(today);
    
    console.log("Début de la semaine dernière:", lastWeek.start); // 2025-02-10
    console.log("Fin de la semaine dernière:", lastWeek.end);

    let code = "add_ele"
    let stat_type = "sum" 
    let time_type = "days"

    if (!device_id ) {
      return res.status(400).json({ message: "Les champs 'device_id', 'code', 'stat_type' sont obligatoires." });
    }

    // trouver la propriete du kit
    let kit = await prisma.kitTongou.findFirst({
      where: {
        idKitTongou: device_id
      }
    })
    if(!kit) return res.status(404).json({ message: "Ce kit n'existe pas.", success: false })
    let kitTongouUser = await prisma.kitTongouUser.findFirst({
      where: {
        kitTongouId: kit.id
      },
      include: {
        CompteElectriciteEau: true
      }
    })
    if(!kitTongouUser) return res.status(404).json({ message: "Ce kit n'est pas rattaché à un utilisateur.", success: false })

    let utilisateurId = kitTongouUser.CompteElectriciteEau.utilisateurId
    let start_time = formatDateToYYYYMMDD(lastWeek.start)
    let end_time = formatDateToYYYYMMDD(lastWeek.end)
    let responseData = []

    // console.log("start_time : ",start_time);
    // console.log("end_time : ",end_time);

    if (getTokens().accessToken === null) {
      try {
        await axios.get(`${port_ecozipo}/gettokentongou`);
      } catch (error) {
        return res.status(500).json({ messageError: "Vous êtes hors ligne, veuillez vérifier votre connexion!" });
      }
    }

    const method = 'GET';
    let url = `/v1.0/cloud/energy/breaker/devices/${device_id}/statistics?user_id=${user_id}&code=${code}&start_time=${start_time}&end_time=${end_time}&stat_type=${stat_type}&time_type=${time_type}`;
    
    let access_token = getTokens().accessToken;
    let body = "";
    let generateSign = await GenerateSign(access_token, body, client_id, key_tongou, url, method);

    let headers = {
      'client_id': generateSign.sign_rep.client_id,
      'access_token': generateSign.sign_rep.access_token,
      'sign': generateSign.sign_rep.sign,
      't': generateSign.sign_rep.t,
      'sign_method': generateSign.sign_rep.sign_method,
    };

    const response = await axios.get(`${end_point_ogemray}${url}`, { headers });

    if (response.data.success) {
      // Convertir le résultat brut en un objet avec les dates comme clés principales
      const rawResult = response.data.result;
      const resultFormatted = rawResult.slice(1, -1).split(', ').reduce((acc, entry) => {
        const [yearMonth, value] = entry.split('=');
        acc[yearMonth] = parseFloat(value);
        return acc;
      }, {});

      const totalConsommation = Object.values(resultFormatted).reduce((acc, value) => acc + value, 0);

      let getRepWeek = await axios.post(`${port_ia}/testWeek`, {conso: parseFloat(totalConsommation.toFixed(2))});
      console.log("getRepWeek : ",getRepWeek.data.status);

      let statusWeek = getRepWeek.data.status
      if(statusWeek ==="1"){
        for (let date in resultFormatted) {
          let dateReference = formatYYYYMMDDtoDate(date)
          let jour = dateReference.getDay() === 0 ? 7 :  dateReference.getDay(); // Pour que lundi soit 0, mardi 1, ..., dimanche 6
          let weekend = jour >= 6 ? 1 : 0;
          
          let consommationDay = resultFormatted[date]
          let getRepWeek = await axios.post(`${port_ia}/testDay`, {conso: consommationDay, jour: jour, week: weekend});
          // console.log(dateReference, " : ",consommationDay, " | jour : ",jour, " | weekend : ",weekend, " | status : ", getRepWeek.data.status);
          if(getRepWeek.data.status === "1"){
            console.log(dateReference, " : ",consommationDay, " | jour : ",jour, " | weekend : ",weekend, " | status : ", getRepWeek.data.status);
            let dateSurconsommer = date
            let start_time_day = dateSurconsommer + "00"
            let end_time_day = dateSurconsommer + "23"
    
    
            if (getTokens().accessToken === null) {
              try {
                await axios.get(`${port_ecozipo}/gettokentongou`);
              } catch (error) {
                return res.status(500).json({ messageError: "Vous êtes hors ligne, veuillez vérifier votre connexion!" });
              }
            }
      
            url = `/v1.0/cloud/energy/breaker/devices/${device_id}/statistics?user_id=${user_id}&code=${code}&start_time=${start_time_day}&end_time=${end_time_day}&stat_type=${stat_type}&time_type=hours`;
            access_token = getTokens().accessToken;
            body = "";
            generateSign = await GenerateSign(access_token, body, client_id, key_tongou, url, method);
        
            headers = {
              'client_id': generateSign.sign_rep.client_id,
              'access_token': generateSign.sign_rep.access_token,
              'sign': generateSign.sign_rep.sign,
              't': generateSign.sign_rep.t,
              'sign_method': generateSign.sign_rep.sign_method,
            };
        
            let responseByDay = await axios.get(`${end_point_ogemray}${url}`, { headers });
              
          
            if (responseByDay.data.success) {
              // Convertir le résultat brut en un objet avec les dates comme clés principales
              const rawResultHours = responseByDay.data.result;
              const resultFormattedHours = rawResultHours.slice(1, -1).split(', ').reduce((acc, entry) => {
                const [yearMonth, value] = entry.split('=');
                acc[yearMonth] = parseFloat(value);
                return acc;
              }, {});
            
              // console.log("dateReference : ",resultFormattedHours);
              let dataFinal = ``

              for (let date in resultFormattedHours) {
                let dateReferenceHours = formatYYYYMMDDtoDateAndHours(date)
                let heure = dateReferenceHours.getUTCHours()
                
                let consommationHours = resultFormattedHours[date]
           
                let getRepHours = await axios.post(`${port_ia}/testHour`, {conso: consommationHours, hour: heure, jour: jour, week: weekend});
                if(getRepHours.data.status === "1"){
                  let date = `${dateReferenceHours.getFullYear()}-${dateReferenceHours.getMonth()+1}-${dateReferenceHours.getDate()}`
                  // console.log(date," : ",consommationHours, " | heure : ",heure, " | jour : ",jour, " | weekend : ",weekend, " | status : ", getRepHours.data.status);
                  let data = `Date: ${date}, Heure : ${heure}, jour : ${jour}, consommation : ${consommationHours} ; `
                  dataFinal = dataFinal + ""+ data
                }
                
              }
              if(dataFinal !== ""){
                // console.log("data : ",dataFinal);
                // console.log("utilisateurId : ",utilisateurId.toString());
                
                // let date = start_time + "-" + end_time

                // let data = {
                //   data: dataFinal,
                //   utilisateurId: utilisateurId.toString(),
                //   date: date
                // }
                // console.log("data : ",data);

                let repAnalyse = await axios.post(`${port_analyse}/analyse`, {data: dataFinal, utilisateurId: utilisateurId.toString(), start_time: start_time, end_time: end_time });
                
                // console.log("repAnalyse : ",repAnalyse.data);
              }
          
            }
          }
        }
      }

      responseData.push({
        "totalConsommation": parseFloat(totalConsommation.toFixed(2)),
        "resultFormatted ": resultFormatted,
        "start_time": start_time,
        "end_time": end_time,
        "utilisateurId " : utilisateurId
      })  
    }
  
    

    return res.status(201).json({
      message: `Statistiques des données d'utilisation (code: ${code}) pour le device_id: ${device_id}`,
      Data : responseData
    });

  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques par semaine", error);
    res.status(500).json({
      message: "Erreur lors de la récupération du token",
      error: error.message
    });
  }
};





/***
 * 
 * Get All Statistics Kit Tongou For IA
 */
export const getAllStatisticsKitTongouForIA = async (req, res) => {
  try {
    const { device_id,  type } = req.body;

    let time_type = ""
    let code = "add_ele"
    let stat_type = "sum"

    if(type === "hour") time_type = "hours"
    else if(type === "days") time_type = "days"
    else if(type === "week") time_type = "days"

    if (!device_id || !type ) {
      return res.status(400).json({ message: "Les champs 'device_id', 'code', 'stat_type' sont obligatoires." });
    }

    // trouver la propriete du kit
    let kit = await prisma.kitTongou.findFirst({
      where: {
        idKitTongou: device_id
      }
    })
    if(!kit) return res.status(404).json({ message: "Ce kit n'existe pas.", success: false })
    let kitTongouUser = await prisma.kitTongouUser.findFirst({
      where: {
        kitTongouId: kit.id
      }
    })
    if(!kitTongouUser) return res.status(404).json({ message: "Ce kit n'est pas rattaché à un utilisateur.", success: false })

    let start_day = new Date(kitTongouUser.createdAt)
    // let start_day = new Date("2025-01-08 11:46:17.751")
    let end_day = new Date()
    let rep = []

    

    if(type === "hour"){
      while(start_day.getTime() < end_day.getTime()){
        start_day.setDate(start_day.getDate() + 1)
        if(start_day.getDay() <= end_day.getDay()){
          let dateReference = formatDateToYYYYMMDD(start_day)
          let start_time = dateReference + "00"
          let end_time = dateReference + "23"
    
    
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
          
      
          if (response.data.success) {
            // Convertir le résultat brut en un objet avec les dates comme clés principales
            const rawResult = response.data.result;
            const resultFormatted = rawResult.slice(1, -1).split(', ').reduce((acc, entry) => {
              const [yearMonth, value] = entry.split('=');
              acc[yearMonth] = parseFloat(value);
              return acc;
            }, {});
          
            rep.push({
              ...resultFormatted
            })
         
         }
  
        }
        
        
      }
    }else {
      let next_monday = new Date(getNextMonday(start_day));
      let final_monday = getWeekStart(end_day);

      while(next_monday.getTime() < final_monday.getTime()){

        // if(next_monday.getDate() !== final_monday.getDate() && next_monday.getMonth() !== final_monday.getMonth()){
          let dateRef = new Date(next_monday);
          let end_week = new Date(dateRef.setDate(dateRef.getDate() + 6));

          let start_time = formatDateToYYYYMMDD(next_monday)
          let end_time = formatDateToYYYYMMDD(end_week)
  
          // console.log("next_monday : ",next_monday);
          // console.log("end_week : ",end_week);
          start_time = "20250217"
          end_time = "20250223"
          console.log("start_time : ",start_time);
          console.log("end_time : ",end_time);

          if (getTokens().accessToken === null) {
            try {
              await axios.get(`${port_ecozipo}/gettokentongou`);
            } catch (error) {
              return res.status(500).json({ messageError: "Vous êtes hors ligne, veuillez vérifier votre connexion!" });
            }
          }
      
          const method = 'GET';
          const url = `/v1.0/cloud/energy/breaker/devices/${device_id}/statistics?user_id=${user_id}&code=${code}&start_time=${start_time}&end_time=${end_time}&stat_type=${stat_type}&time_type=${time_type}`;
          // console.log("url", url);
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
          // console.log("response", response.data);
      
          if (response.data.success) {
            // Convertir le résultat brut en un objet avec les dates comme clés principales
            const rawResult = response.data.result;
            const resultFormatted = rawResult.slice(1, -1).split(', ').reduce((acc, entry) => {
              const [yearMonth, value] = entry.split('=');
              acc[yearMonth] = parseFloat(value);
              return acc;
            }, {});

            const totalConsommation = Object.values(resultFormatted).reduce((acc, value) => acc + value, 0);
            // console.log("totalConsommation", totalConsommation);
          
            rep.push({
              // ...resultFormatted,
              "totalConsommation": parseFloat(totalConsommation.toFixed(2)),
              "start_time": start_time,
              "end_time": end_time
            })  
          }

          // console.log();
  
  
        // }

     
        next_monday.setDate(next_monday.getDate() + 7)
       

      }

      // console.log("final_monday : ",final_monday);
      
    }

    // console.log("start_day : ",start_day);
    // console.log("end_day : ",end_day);

  
    

    return res.status(201).json({
      message: `Statistiques des données d'utilisation (code: ${code}) pour le device_id: ${device_id}`,
      Data : rep
    });

  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la récupération du token",
      error: error.message
    });
  }
};



/***
 * 
 * Send Statistic Kit Week
 */
export const sendStatisticKitWeek = async (req, res) => {
  try {

    let time_type = "days"
    let code = "add_ele"
    let stat_type = "sum"

    let kitTongouUser = await prisma.kitTongouUser.findMany({
      where: {
        KitTongou:{
          KitType: {
            id: 1
          }
        }
      },
      include: {
        KitTongou: true
      }
    })
    if(!kitTongouUser) return res.status(404).json({ message: "Ce kit n'est pas rattaché à un utilisateur.", success: false })


    let date_ref = new Date()
    let rep = []


    let start_week = getWeekStart(date_ref);
    let end_week = new Date(date_ref.setDate(date_ref.getDate() + 6));
    console.log(start_week);
    console.log(end_week);


    for (let i = 0; i < kitTongouUser.length; i++) {
      rep = []
      let device_id = kitTongouUser[i].KitTongou.idKitTongou

      let start_time = formatDateToYYYYMMDD(start_week)
      let end_time = formatDateToYYYYMMDD(end_week)

      // console.log("next_monday : ",next_monday);
      // console.log("end_week : ",end_week);

      // start_time = "20250217"
      // end_time = "20250223"
      console.log("start_time : ",start_time);
      console.log("end_time : ",end_time);

      if (getTokens().accessToken === null) {
        try {
          await axios.get(`${port_ecozipo}/gettokentongou`);
        } catch (error) {
          return res.status(500).json({ messageError: "Vous êtes hors ligne, veuillez vérifier votre connexion!" });
        }
      }
  
      const method = 'GET';
      const url = `/v1.0/cloud/energy/breaker/devices/${device_id}/statistics?user_id=${user_id}&code=${code}&start_time=${start_time}&end_time=${end_time}&stat_type=${stat_type}&time_type=${time_type}`;
      // console.log("url", url);
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
      // console.log("response", response.data);
  
      if (response.data.success) {
        // Convertir le résultat brut en un objet avec les dates comme clés principales
        const rawResult = response.data.result;
        const resultFormatted = rawResult.slice(1, -1).split(', ').reduce((acc, entry) => {
          const [yearMonth, value] = entry.split('=');
          acc[yearMonth] = parseFloat(value);
          return acc;
        }, {});

        const totalConsommation = Object.values(resultFormatted).reduce((acc, value) => acc + value, 0);

        if(totalConsommation > 0){
          rep.push({
            "idkit": device_id,
            "conso": parseFloat(totalConsommation.toFixed(2))
          })  
          await axios.post(`${port_ia}/addWeek`, {idkit: device_id, conso: parseFloat(totalConsommation.toFixed(2))});
          console.log("rep : ",rep);
        }
      
      }
      
    }



    

    return res.status(201).json({
      message: `Statistiques des données par kit`,
      success: true
    });

  } catch (error) {
    console.error(`Erreur lors de la récupération des statistiques par semaine`, error);
    res.status(500).json({
      message: "Erreur lors de la récupération du token",
      error: error.message
    });
  }
};




/***
 * 
 * Send statistic Kit days
 */
export const sendStatisticKitDays = async (req, res) => {
  try {

    let time_type = "days"
    let code = "add_ele"
    let stat_type = "sum"

    let kitTongouUser = await prisma.kitTongouUser.findMany({
      where: {
        KitTongou:{
          KitType: {
            id: 1
          }
        }
      },
      include: {
        KitTongou: true
      }
    })
    if(!kitTongouUser) return res.status(404).json({ message: "Ce kit n'est pas rattaché à un utilisateur.", success: false })


    let date_ref = new Date()
    let date_YYYYMMDD = formatDateToYYYYMMDD(date_ref)
    let rep = []

    for (let i = 0; i < kitTongouUser.length; i++) {
      rep = []
      let device_id = kitTongouUser[i].KitTongou.idKitTongou
      // date_YYYYMMDD = "20250222"
      let start_time = date_YYYYMMDD
      let end_time = date_YYYYMMDD

      // console.log("next_monday : ",next_monday);
      // console.log("end_week : ",end_week);

      // start_time = "20250217"
      // end_time = "20250217"
      console.log("start_time : ",start_time);
      console.log("end_time : ",end_time);

      if (getTokens().accessToken === null) {
        try {
          await axios.get(`${port_ecozipo}/gettokentongou`);
        } catch (error) {
          return res.status(500).json({ messageError: "Vous êtes hors ligne, veuillez vérifier votre connexion!" });
        }
      }
  
      const method = 'GET';
      const url = `/v1.0/cloud/energy/breaker/devices/${device_id}/statistics?user_id=${user_id}&code=${code}&start_time=${start_time}&end_time=${end_time}&stat_type=${stat_type}&time_type=${time_type}`;
      // console.log("url", url);
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
      // console.log("response", response.data);
  
      if (response.data.success) {
        // Convertir le résultat brut en un objet avec les dates comme clés principales
        const rawResult = response.data.result;
        const resultFormatted = rawResult.slice(1, -1).split(', ').reduce((acc, entry) => {
          const [yearMonth, value] = entry.split('=');
          acc[yearMonth] = parseFloat(value);
          return acc;
        }, {});

        const totalConsommation = Object.values(resultFormatted).reduce((acc, value) => acc + value, 0);

        if(totalConsommation > 0){
          rep.push({
            "idkit": device_id,
            "conso": parseFloat(totalConsommation.toFixed(2)),
            "date": date_YYYYMMDD
          })  
          await axios.post(`${port_ia}/addDay`, {idkit: device_id, conso: parseFloat(totalConsommation.toFixed(2)), date: date_YYYYMMDD});
          console.log("rep : ",rep);
        }
      
      }
      
    }



    

    return res.status(201).json({
      message: `Statistiques des données par kit`,
      success: true
    });

  } catch (error) {
    console.error(`Erreur lors de la récupération des statistiques par semaine`, error);
    res.status(500).json({
      message: "Erreur lors de la récupération du token",
      error: error.message
    });
  }
};



/***
 * 
 * Send statistic Kit hours
 */
export const sendStatisticKitHours = async (req, res) => {
  try {

    let time_type = "hours"
    let code = "add_ele"
    let stat_type = "sum"

    let kitTongouUser = await prisma.kitTongouUser.findMany({
      where: {
        KitTongou:{
          KitType: {
            id: 1
          }
        }
      },
      include: {
        KitTongou: true
      }
    })
    if(!kitTongouUser) return res.status(404).json({ message: "Ce kit n'est pas rattaché à un utilisateur.", success: false })


    let date_ref = new Date()
    let date_YYYYMMDD = formatDateToYYYYMMDD(date_ref)
    let rep = []

    for (let i = 0; i < kitTongouUser.length; i++) {
      rep = []
      let device_id = kitTongouUser[i].KitTongou.idKitTongou
      date_YYYYMMDD = "20250221"
      let start_time = date_YYYYMMDD+"00"
      let end_time = date_YYYYMMDD+"23"

      // console.log("next_monday : ",next_monday);
      // console.log("end_week : ",end_week);

      // start_time = "20250217"
      // end_time = "20250217"
      console.log("start_time : ",start_time);
      console.log("end_time : ",end_time);

      if (getTokens().accessToken === null) {
        try {
          await axios.get(`${port_ecozipo}/gettokentongou`);
        } catch (error) {
          return res.status(500).json({ messageError: "Vous êtes hors ligne, veuillez vérifier votre connexion!" });
        }
      }
  
      const method = 'GET';
      const url = `/v1.0/cloud/energy/breaker/devices/${device_id}/statistics?user_id=${user_id}&code=${code}&start_time=${start_time}&end_time=${end_time}&stat_type=${stat_type}&time_type=${time_type}`;
      // console.log("url", url);
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
      // console.log("response", response.data);
  
      if (response.data.success) {
        // Convertir le résultat brut en un objet avec les dates comme clés principales
        const rawResult = response.data.result;
        const resultFormatted = rawResult.slice(1, -1).split(', ').reduce((acc, entry) => {
          const [yearMonth, value] = entry.split('=');
          acc[yearMonth] = parseFloat(value);
          return acc;
        }, {});
        // console.log("resultFormatted : ",resultFormatted);
        const totalConsommation = Object.values(resultFormatted).reduce((acc, value) => acc + value, 0);

       
        if(totalConsommation > 0){
          let conso = []
          for (let date in resultFormatted) {
            conso.push(parseFloat(resultFormatted[date].toFixed(2)))
          }
          rep.push({
            "idkit": device_id,
            "conso": conso,
            "date": date_YYYYMMDD
          })  
          await axios.post(`${port_ia}/addHour`, {idkit: device_id, conso: conso, date: date_YYYYMMDD});
          console.log("rep : ",rep);
          console.log("----");
        }
      
      }
      
    }



    

    return res.status(201).json({
      message: `Statistiques des données par kit`,
      success: true
    });

  } catch (error) {
    console.error(`Erreur lors de la récupération des statistiques par semaine`, error);
    res.status(500).json({
      message: "Erreur lors de la récupération du token",
      error: error.message
    });
  }
};




function getNextMonday(date) {
  let day = date.getDay(); // Jour de la semaine (0 = Dimanche, ..., 6 = Samedi)
  let nextMonday = date
  if(day !== 1){
    let daysToAdd = day === 1 ? 7 : (8 - day) % 7; // Si lundi, ajoute 7 jours, sinon ajuste jusqu'au lundi suivant
    nextMonday = new Date(date);
    nextMonday.setDate(date.getDate() + daysToAdd)
  }
;
  return nextMonday;
}


function getLastWeek(date) {
  let day = date.getDay(); // 0 = Dimanche, 1 = Lundi, ..., 6 = Samedi
  let daysSinceMonday = (day + 6) % 7; // Nombre de jours depuis le dernier lundi
  
  let lastMonday = new Date(date);
  lastMonday.setDate(date.getDate() - daysSinceMonday - 7); // Lundi de la semaine dernière
  
  let lastSunday = new Date(lastMonday);
  lastSunday.setDate(lastMonday.getDate() + 6); // Dimanche de la semaine dernière

  return { start: lastMonday, end: lastSunday };
}


function getWeekStart(date) {
  let day = date.getDay(); // Jour actuel (0 = Dimanche, ..., 6 = Samedi)
  let daysToSubtract = (day === 0 ? 6 : day - 1); // Déplacer vers le lundi précédent
  let weekStart = new Date(date);
  weekStart.setDate(date.getDate() - daysToSubtract);
  return weekStart;
}