import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv';
import axios from 'axios'
import axiosRetry from 'axios-retry'
import crypto from 'crypto';
import { getTokens } from '../../utils/tokenStore.js';
import { GenerateSign } from '../ConfigController.js';
import { consommationJourIA, consommationSemaineIA, kitTongouHorsLigneIA, surIntensiteIA, surPuissanceIA, surTensionIA } from './KitTongouIAController.js';
import { CalculTKwhEnAriaryTTC } from '../JiramaCalculController.js';
import { format, startOfWeek, endOfWeek, subWeeks } from 'date-fns';
import { formatDateYYYYMMDD, getConsommationKitTongouMois } from './KitTongouUserController.js';
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




/***
 * 
 * Get Scheduled Task
 */
export const getScheduledTask = async (req, res) => {
  try {
    const { device_id } = req.body;
    if(!device_id) return res.status(400).json({ message: "Le 'device_id' est obligatoire.", success: false });
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

      const method = 'GET';
      const url = `/v1.0/cloud/energy/breaker/timer/device/${device_id}?user_id=${user_id}`
      
      // /v1.0/cloud/energy/breaker/timer/device/bff96527f75046059crdcz?user_id=beu17307728264132Npu
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
        // response = await axios.get(`${end_point_ogemray}${url}`, null, {
        //   headers: headers,
        // });
        
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
    
    if (isValid) {      
      
      return res.status(201).json({
        message: `Listes des tâches du kit ${device_id}`,
        data: response.data.result,
        success: response.data.success
      });

    } else {
      
      return res.status(400).json({ message: response.data.msg, success: false });
    }

  

  } catch (error) {
      console.error("Erreur lors de get l'API Schulder Task", error);
    res.status(500).json({
      message: error.message,
      success: false 
    });
  }
};



/***
 * 
 * Add Scheduled Task
 */
export const AddScheduledTask = async (req, res) => {
    try {
      const { device_id, value, alias_name, time, date, loops } = req.body;
      if(!device_id) return res.status(400).json({ message: "Le 'device_id' est obligatoire.", success: false });
      if(!value) return res.status(400).json({ message: "Veuillez séléctionner si vous voulez allumer ou éteindre le kit.", success: false });
      if(!alias_name) return res.status(400).json({ message: "Veuillez ajouter le nom de votre tâche.", success: false });
      if(!time) return res.status(400).json({ message: "Veuillez ajouter l'heure de votre tâche.", success: false });
      if(!date) return res.status(400).json({ message: "Veuillez ajouter la date de votre tâche.", success: false });
      
      let isValid = false;
      let response = {};
      let retries = 0; 
  
      if (!device_id || !code) {
        return res.status(400).json({ message: "Les champs 'device_id' et 'value' sont obligatoires." });
      }


      // trouver si le kit est principal
      const ifKitPrincipale = await prisma.kitTongou.findFirst({
        where: {
          idKitTongou: device_id
        }
      })
      if(!ifKitPrincipale) return res.status(400).json({ message: "Le kit n'existe pas.", success: false });
      if(ifKitPrincipale.kitTypeId === 1) return res.status(400).json({ message: "Le kit principal ne peut pas planifier de tâches.", success: false });

      
  
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
        const url = `/v1.0/cloud/energy/breaker/timer/device/${device_id}`
        // const url = `/v1.0/cloud/energy/micro/device/command/${device_id}?user_id=${user_id}&code=switch&value=${value}`;
        const access_token = getTokens().accessToken;
        
        const dateFormat = new Date(date);
        if (isNaN(dateFormat)) {
          return res.status(400).json({ message: "La date fournie n'est pas valide.", success: false });
        }
        const year = dateFormat.getFullYear();
        const month = String(dateFormat.getMonth() + 1).padStart(2, '0'); 
        const day = String(dateFormat.getDate()).padStart(2, '0'); 
    
        
        const body = 
        {
            user_id: user_id,
            category: "",
            alias_name: alias_name,
            time: time,
            timezone_id: "Africa/Madagascar",
            date: `${year}${month}${day}`,
            loops: `${loops.dimanche}${loops.lundi}${loops.mardi}${loops.mercredi}${loops.jeudi}${loops.vendredi}${loops.samedi}`,
            functions: [
                {
                    code: "switch",
                    value: value
                }
            ]
        }
        ;

        
        const generateSign = await GenerateSign(access_token, body, client_id, key_tongou, url, method);
  
        const headers = {
          'client_id': generateSign.sign_rep.client_id,
          'access_token': generateSign.sign_rep.access_token,
          'sign': generateSign.sign_rep.sign,
          't': generateSign.sign_rep.t,
          'sign_method': generateSign.sign_rep.sign_method,
        };
        
        try {
          response = await axios.post(`${end_point_ogemray}${url}`, body, {
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
      
      // console.log("response : ",response.data);
     

      let message = `Votre kit s'éteint le ${date} à ${time} `;
      let terme = "allume"
      const jours = Object.keys(loops).filter(key => loops[key] === '1');
      if(value === "false") terme = "éteint"
      if(loops.dimanche === "0" && loops.lundi === "0" && loops.mardi === "0" && loops.mercredi === "0" && loops.jeudi === "0" && loops.vendredi === "0" && loops.samedi === "0") message = `Votre kit s'${terme} le ${date} à ${time}`;
      else message = `Votre kit s'${terme} le ${date} à ${time} tout les ${jours.join(', ')}`;
      
      if (isValid) {      
        if(value === "true"){
          console.log("kitTongouId : ",ifKitPrincipale.id);
          console.log("aliasName : ",alias_name);
          console.log("date : ",date);
          console.log("value : ",value);
          console.log("loops : ",loops);
          console.log("timerId : ",response.data.result);
          console.log("timezoneId : Indian/Antananarivo");

          // ajouter 
          
        }
        return res.status(201).json({
          message: message,
          data: response.data,
          success: response.data.success
        });
  
      } else {
        return res.status(400).json({ message: response.data.msg, success: false });
      }
  
    
  
    } catch (error) {
        console.error("Erreur lors de l'API Add Schulder Task", error);
      res.status(500).json({
        message: error.message,
        success: false 
      });
    }
};
  








/***
 * 
 * Delete Scheduled Task
 */
export const deleteScheduledTask = async (req, res) => {
  try {
    const { device_id, timer_ids} = req.body;
    if(!device_id) return res.status(400).json({ message: "Le 'device_id' est obligatoire.", success: false });
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

      const method = 'DELETE';
      let url = `/v1.0/cloud/energy/breaker/timer/device/${device_id}/batch`
      
      
      const access_token = getTokens().accessToken;
      
      const body = 
        {
            user_id: user_id,
            timer_ids: timer_ids
        }
        ;
      
      
      const generateSign = await GenerateSign(access_token, body, client_id, key_tongou, url, method);

      const headers = {
        'client_id': generateSign.sign_rep.client_id,
        'access_token': generateSign.sign_rep.access_token,
        'sign': generateSign.sign_rep.sign,
        't': generateSign.sign_rep.t,
        'sign_method': generateSign.sign_rep.sign_method,
      };
      
      
      try {
        
        response = await axios.request({
          method: 'DELETE',
          url: `${end_point_ogemray}${url}`,
          headers: headers,
          data: body, 
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
    
    if (isValid) {      
      
      return res.status(201).json({
        message: `Tâches supprimées avec succès`,
        data: response.data.result,
        success: response.data.success
      });

    } else {
      return res.status(400).json({ message: response.data.msg, success: false });
    }

  

  } catch (error) {
      console.error("Erreur lors de get l'API Schulder Task", error);
    res.status(500).json({
      message: error.message,
      success: false 
    });
  }
};


  





// // Fonction pour obtenir le timestamp
// function getTime() {
//   // return new Date().getTime().toString();
//   return Date.now().toString();
// }

// // Fonction de calcul de signature
// function calcSign(clientId, accessToken, timestamp, nonce, signStr, secret) {
//   const str = clientId + accessToken + timestamp + nonce + signStr;
//   const hash = crypto.createHmac('sha256', secret).update(str, 'utf8').digest('base64');
//   return hash.toUpperCase();
// }

// // Fonction pour remplacer les paramètres de Postman par les valeurs de l'environnement
// function replacePostmanParams(str, environment) {
//   while (str.indexOf("{{") !== -1 && str.indexOf("}}") !== -1) {
//       const key = str.substring(str.indexOf("{{") + 2, str.indexOf("}}"));
//       let value = environment[key] || "";
//       str = str.replace("{{" + key + "}}", value);
//   }
//   return str;
// }

// // Fonction pour générer la chaîne de signature
// function stringToSign(query, mode, method, secret, requestUrl, requestBody, headers) {
//   let sha256 = "";
//   let url = "";
//   let headersStr = "";
//   const arr = [];
//   let bodyStr = "";

//   console.log("requestBody : ",requestBody);
  
//   // Processus des paramètres de la requête (query)
//   if (query) {
//       for (let key in query) {
//           arr.push(key);
//           arr.sort();
//       }
//   }

//   // Traitement du corps de la requête
//   if (requestBody && mode) {
//       if (mode !== "formdata" && mode !== "urlencoded") {
//           bodyStr = replacePostmanParams(JSON.stringify(requestBody), {});
//       } else {
//           bodyStr = JSON.stringify(requestBody);  // Ajoutez le traitement pour formdata/urlencoded si nécessaire
//       }
//   }
//   console.log("bodyStr : ",bodyStr);
  
//   sha256 = crypto.createHash('sha256').update(bodyStr, 'utf8').digest('hex');

//   console.log("sha256 : ",sha256);
  

//   // Construction de l'URL pour la signature
//   arr.forEach((item) => {
//       url += item + "=" + query[item] + "&";
//   });

//   if (url.length > 0) {
//       url = url.substring(0, url.length - 1);
//       url = "/" + requestUrl + "?" + url;
//   } else {
//       url = "/" + requestUrl;
//   }

//   // Traitement des en-têtes si spécifiés
//   if (headers["Signature-Headers"]) {
//       const signHeaderStr = headers["Signature-Headers"];
//       const signHeaderKeys = signHeaderStr.split(":");
//       signHeaderKeys.forEach((item) => {
//           let val = headers[item] || "";
//           headersStr += item + ":" + val + "\n";
//       });
//   }

//   url = replacePostmanParams(url, {});  // Remplacez par vos variables d'environnement
//   const signStr = method + "\n" + sha256 + "\n" + headersStr + "\n" + url;

//   return { url, signStr };
// }

// Fonction pour ajouter une tâche
// export const AddScheduledTask = async (req, res) => {
//   try {
//       const { clientId, accessToken, secret, requestUrl, requestBody, headers, method } = req.body;

//       // Calcul du timestamp
//       const timestamp = getTime();
//       const nonce = headers["nonce"] || "";

//       // Générer la chaîne de signature
//       const signMap = stringToSign({}, "json", method, secret, requestUrl, requestBody, headers);
//       const sign = calcSign(clientId, accessToken, timestamp, nonce, signMap.signStr, secret);

//       console.log("sign : ",sign);
//       console.log("signMap : ",signMap);
//       console.log("timestamp : ",timestamp);
//       console.log("requestBody: ",requestBody);
      
      
      

//       // Vous pouvez envoyer la requête avec axios ou autre
//       const response = await axios({
//           method: method,
//           url: requestUrl,
//           headers: {
//               'Authorization': `Bearer ${accessToken}`,
//               'Sign': sign,
//               'Timestamp': timestamp,
//               'Nonce': nonce
//           },
//           data: requestBody
//       });

      

//       // Répondre à la requête avec les données de la réponse
//       res.json({
//           message: "Task added successfully",
//           data: response.data
//       });
//   } catch (error) {
//       console.error(error);
//       res.status(500).json({ message: "An error occurred", error: error.message });
//   }
// };


