import dotenv from 'dotenv';
import axios from 'axios';
import { execFile } from "child_process";
import { fileURLToPath } from 'url';
import path from 'path';
import { platform } from "os";
import { PrismaClient } from '@prisma/client'

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const port_ecozipo = process.env.PORT_ECOZIPO;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '../..');
const prisma = new PrismaClient()

let pythonPath = ""
if (platform() === "win32") {
  // Pour Windows
  pythonPath = path.join(projectRoot, 'env', 'Scripts', 'python.exe');
} else {
  // Pour Linux (Render)
  pythonPath = "/opt/render/project/src/env/bin/python3";
}


/**
 * ANALYSE IA IN CONSOMMATION KIT IN 7 LAST DAYS
 */
export const AnalyseKwh7LastDaysIA = async (req, res) => {
  let { device_id, compteElectriciteEauId } = req.body;
  if (!device_id || !compteElectriciteEauId) {
    return res.status(400).json({ message: "Les champs 'device_id' et 'compteElectriciteEauId' sont obligatoires." });
  }
  let rep = {};

  // find kit tongou
  const kitTongou = await prisma.kitTongou.findFirst({
    where: {
      idKitTongou: device_id,
    },
  });

  // find kit tongou user
  const kitTongouUser = await prisma.kitTongouUser.findFirst({
    where: {
      kitTongouId: kitTongou.id,
    },
  });
  let start_time = kitTongouUser.createdAt
  
  // Convertir la chaîne en un objet Date
  let date = new Date(start_time);
  let year = date.getFullYear();
  let month = String(date.getMonth() + 1).padStart(2, '0'); // Les mois commencent à 0
  let day = String(date.getDate()).padStart(2, '0');

  // Combiner en format 20241213
  start_time = `${year}${month}${day}`;

  // Convertir la chaîne en un objet Date
  let end_time = new Date();
  let year_end_time = end_time.getFullYear();
  let month_end_time = String(end_time.getMonth() + 1).padStart(2, '0'); // Les mois commencent à 0
  let day_end_time = String(end_time.getDate()).padStart(2, '0');

  // Combiner en format 20241213
  end_time = `${year_end_time}${month_end_time}${day_end_time}`;

  try {
    rep = await axios.post(
      `${port_ecozipo}/getstatisticskittongou`,
      {
        device_id: device_id,
        compteElectriciteEauId: compteElectriciteEauId,
        start_time:start_time,
        end_time:end_time,
        code:"add_ele",
        stat_type:"sum",
        time_type:"days"
      }
    );

    // rep = await axios.post(
    //   `${port_ecozipo}/getstatisticskitby7lastdays`,
    //   {
    //     device_id: device_id,
    //     compteElectriciteEauId: compteElectriciteEauId,
    //   }
    // );
    
//     POST http://localhost:4000/getstatisticskittongou
// Content-Type: application/json

// {
//     "device_id": "bfa3dc80b4e3d59749zxqg",
//     "code":"add_ele",
//     "start_time":"20241106",
//     "end_time":"20241216",
//     "stat_type":"sum",
//     "time_type":"days"
// }
      
      
      // // Utiliser la date actuelle si aucune date n'est fournie
      // const givenDate = date ? new Date(date) : new Date();
      // if (isNaN(givenDate)) {
      //   return res.status(400).json({ message: "La date fournie n'est pas valide." });
      // }
      
      // const endDate = new Date(givenDate); 
      // let startDate = new Date(givenDate);
      
      // let data = {}
      // let consommationTotal = 0
      // for (let index = 6; index >= 0; index--) {
      //   startDate.setDate(endDate.getDate() - index);
      //   let dateFormat = formatDateYYYYMMDD(startDate)
      //   let rep_consommation = await functionGetStatisticsKitTongou(device_id, "add_ele", dateFormat, dateFormat, "sum", "days"); 
      //   let consommationKwh = rep_consommation.data.result[dateFormat]
      //   consommationTotal = consommationTotal + consommationKwh
      //   let prixTranche = await CalculTKwhEnAriaryTTC(compteElectriciteEauId, consommationKwh)
      //   data[dateFormat] = [{
      //     consommation : rep_consommation.data.result[dateFormat],
      //     prixTranche : prixTranche.data.prixTotalTranche
      //   }]
      // }
      // let prixTTCs = 0
      // let calculprixTTC = await CalculTKwhEnAriaryTTC(compteElectriciteEauId, consommationTotal)
      // prixTTCs = calculprixTTC.data.prixTTC
    
      // return res.status(201).json({
      //   message: `Statistiques de votre consommation de 7 derniers jours`,
      //   data: {
      //     result: data,
      //     success: true,
      //     consommation: parseFloat(consommationTotal.toFixed(2)),
      //     prixTTC: parseFloat(prixTTCs.toFixed(2))
      //   }
      // });  

  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message, success: false });
  }

  console.log("rep : ",rep.data);
  

  
  // Extraire les consommations
  const consumptions = rep.data.data.result;

  // Convertir les consommations en une chaîne lisible
  let data = Object.entries(consumptions).map(([date, values]) => {
    const consommation = values[0]?.consommation || 0; // Prendre la consommation du premier élément
    return { date, consommation };
  });
  

  execFile(pythonPath, ["isolation_forest.py", JSON.stringify(data)], async (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ message: `Erreur Python: ${stderr}`, success: false });
    }
    // Filtrer la sortie stdout pour ne conserver que la partie JSON
    const cleanedStdout = stdout.split("\n").filter(line => line.trim().startsWith("[")).join("\n");
    
    try {
      // Résultat des anomalies
      const anomalies = JSON.parse(cleanedStdout.trim());
      // anomalies.map(a => {
      //   console.log(`Date: ${a.date}, Consommation: ${a.consommation} kWh, Anomalie: ${a.status}`);
      // });
      
        
      // Préparer la demande à GPT-4
      const prompt = `
        Voici les données d'anomalies de consommation d'un utilisateur :
        ${anomalies.map(a => `Date: ${a.date}, Consommation: ${a.consommation} kWh, Anomalie: ${a.status}`).join("\n")}

        N.B : Anomalie = 1 : c'est normale et 0 : c'est une anomalie
        Rédigez une notification claire et concise expliquant les anomalies détectées
        Dire la consommation le plus élevé (anomalie -1) et c'est tout.
        Je veux une phrase comme ça, pas long et courte 
        Faire juste comme une sorte de notification, dire les anomalies comme une sorte d'alerte pour l'utilisateur
        Ne dit pas cher utilisateur, notification, dit tout simplement le message et c'est tout
        Je veux une message courte et claire
        Faites comme une vraie notification pour l'utilisateur, comme une IA intelligente
        Veuillez bien reformuler votre français.
        `;

      const response = await axios.post(
        OPENAI_API_URL,
        {
          model: "gpt-4",
          messages: [
            { role: "system", content: "Vous êtes un assistant générant des notifications personnalisées." },
            { role: "user", content: prompt },
          ],
          max_tokens: 300,
        },
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const notification = response.data.choices[0].message.content;

      return res.status(200).json({ anomalies, notification, success: true });
    } catch (apiError) {
      return res.status(500).json({ message: `Erreur GPT-4: ${apiError.message}`, success: false });
    }
  });
};





/**
 * Notification Kit Hors Ligne
 */
export async function kitTongouHorsLigneIA(data) {
  console.log("data consommationJourIA : ",data);
  let messagePrompt = ""

  if(data.timeUnit === "minute"){
    messagePrompt = `Veuillez vérifier votre kit ${data.pseudo} car il est hors ligne pendant les ${data.addTime} derniers minutes. Cela peut causser une problème sur la collecte des données.`;
  }else if(data.timeUnit=== "hour"){
    messagePrompt = `Veuillez vérifier votre kit ${data.pseudo} car il est hors ligne pendant les ${data.addTime} derniers heures. Cela peut causser une problème sur la collecte des données.`;
  }
  
  const contextDescription = `
    Reformule le message suivant pour le rendre plus clair, concis.
    Les réponses doivent être toujours en français. 
    Message : "${messagePrompt}"
  `;


  try {
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4',
        messages: [
          { role: 'system', content: "Vous êtes un assistant qui reformule des messages pour les rendre plus clairs et plus simples." },
          { role: 'user', content: contextDescription },
        ],
        max_tokens: 100,
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    let reply = response.data.choices[0].message.content;
    return { message: reply };
  } catch (error) {
    return { messageError: `Error calling OpenAI API : ${error.response ? error.response.data : error.message}` };
  }
}




/**
 * Reponse IA Create Kit User
 */
export async function ReponseIACreateKitUser(data, modeGestionId) {

  // Déterminez le message de base en fonction de la valeur du seuil
  // let messagePrompt = ``;
  // if(modeGestionId === 1){  // économique
  //   messagePrompt = `Félicitations votre appareil est bien ajouté! En activant le mode économie, vous économisez plus de 20% de votre consommation d'énergie, soit environ ${data.consommationNormal}kWh par mois, ce qui équivaut à ${data.prixTTC}Ariary ! Vous économisez ainsi ${data.consommationJour}kWh par jour.`
  // }else if (modeGestionId === 2) {  // normal
  //   messagePrompt = `Félicitations votre appareil est bien ajouté!  Profitez pleinement de votre appareil en mode normal.`
  // }else { // performance
  //   messagePrompt = `Félicitations pour l'ajout de votre appareil ! En mode performance, il vous offrira des performances optimales au prix d'une consommation d'énergie légèrement supérieure dont ${data.consommationNormal}kWh par mois (${data.prixTTC}Ariary) et ${data.consommationJour}kWh`
  // }

  // Ajouter une instruction pour ChatGPT de reformuler ce message pour le rendre plus clair
  const contextDescription = `
     1. Félicitations ! L'appareil ${data.pseudo} a été ajouté avec succès et est prêt à optimiser la gestion énergétique.\n
     2. Bravo ! Le kit ${data.pseudo} est désormais enregistré et prêt à fonctionner efficacement.\n
     3. Félicitations pour l’ajout du kit ${data.pseudo} ! La configuration est complète pour une gestion optimale.\n
     4. Excellent ! ${data.pseudo} est maintenant opérationnel et configuré pour améliorer les performances énergétiques.\n
     5. Félicitations ! L'appareil ${data.pseudo} a été intégré avec succès et est prêt à améliorer la gestion de la consommation.\n
     6. Bravo ! ${data.pseudo} est enregistré et prêt à fonctionner pour une utilisation optimale.\n
     7. Félicitations ! Le dispositif ${data.pseudo} a été ajouté avec succès et est prêt à assurer une gestion énergétique performante.\n
     8. Bravo pour l’ajout du kit ${data.pseudo} ! La configuration est terminée et optimisée.\n
     9. Félicitations ! ${data.pseudo} a bien été enregistré et est prêt à garantir une gestion énergétique optimale.\n
     10.  Félicitations pour l’intégration de ${data.pseudo} ! Tout est en place pour une performance énergétique optimale. \n

     Voici quelque type de réponse pour améliorer votre réponse \n
     Je ne dit pas de choisir entre ces réponses mais reformuler la réponse par rapport à ces choix \n
     La réponse doit être toujours en français. \n
  `;


  // const response = await axios.post(
  //   OPENAI_API_URL,
  //   {
  //     model: 'gpt-4-turbo',
  //     logprobs: true,
  //     top_logprobs: 2,
  //     messages: [
  //       { role: 'assistant', content: contextDescription }, // Ajouter la description comme message de contexte
  //       { role: 'user', content: `
  //         - Donner la consommation différece de consommation par rapport à la mois précédente \`n
  //         - Analyser la profile de consommation (donner la consommation moyenne par période dont ce qui pointe et creux avec la valeur)\`n
  //         - Recommander pour économiser l'énergie
  //       ` },
  //     ],
  //     // max_tokens: 100, // Limitez le nombre de tokens pour les réponses suivantes
  //   },
  //   {
  //     headers: {
  //       'Authorization': `Bearer ${OPENAI_API_KEY}`,
  //       'Content-Type': 'application/json',
  //     },
  //   }
  // );

  try {
    const response = await axios.post(
      OPENAI_API_URL,
      {
        // model: 'gpt-4o',
        // messages: [
        //   { role: 'system', content: contextDescription }, // Ajouter la description comme message de contexte
        // ],
        model: 'gpt-4-turbo',
        logprobs: true,
        top_logprobs: 2,
        messages: [
          { role: 'assistant', content: contextDescription }, // Ajouter la description comme message de contexte
          { role: 'user', content: `
            Donner une phrase meilleur par rapport aux context description  \`n
          ` },
        ],
        max_tokens: 100, // Limitez le nombre de tokens pour les réponses suivantes
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    let reply = response.data.choices[0].message.content;
    
    return { msg: reply };
  } catch (error) {
    return { messageError: `Error calling OpenAI API : ${error.response ? error.response.data : error.message}` };
  }
}


/**
 * Reponse IA Update Gestion Kit 
 */
export async function updateModeGestionIA(data, modeGestionId) {

  // Déterminez le message de base en fonction de la valeur du seuil
  let messagePrompt = ``;
  if(modeGestionId === 1){  // économique
    messagePrompt = `Mode économie activé, vous économisez plus de 20% de votre consommation d'énergie, soit environ ${data.consommationNormal}kWh par mois, ce qui équivaut à ${data.prixTTC}Ariary ! Vous économisez ainsi ${data.consommationJour}kWh par jour.`
  }else if (modeGestionId === 2) {  // normal
    messagePrompt = `Mode normal activé Profitez pleinement de votre appareil en mode normal.`
  }else { // performance
    messagePrompt = `Mode performance activé, il vous offrira des performances optimales au prix d'une consommation d'énergie légèrement supérieure dont ${data.consommationNormal}kWh par mois (${data.prixTTC}Ariary) et ${data.consommationJour}kWh`
  }

  // Ajouter une instruction pour ChatGPT de reformuler ce message pour le rendre plus clair
  const contextDescription = `
    Reformule le message suivant pour le rendre plus clair, concis. 
    La réponse doit être toujours en français.
    Message : "${messagePrompt}"
  `;


  try {
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4',
        messages: [
          { role: 'system', content: contextDescription }, // Ajouter la description comme message de contexte
        ],
        max_tokens: 100, // Limitez le nombre de tokens pour les réponses suivantes
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    let reply = response.data.choices[0].message.content;
    
    return { msg: reply };
  } catch (error) {
    return { messageError: `Error calling OpenAI API : ${error.response ? error.response.data : error.message}` };
  }
}



/**
 * Reponse IA Update ConsommationMin kit
 */
export async function updateConsommationMinKitValeurIA(data, modeGestionId) {

  // Déterminez le message de base en fonction de la valeur du seuil
  let messagePrompt = ``;
  if(modeGestionId === 1){  // économique
    messagePrompt = `Votre consommation maximale est de ${data.min} kWh. En mode économie, vous pouvez consommer jusqu'à ${data.consommationNormal} kWh par mois pour ${data.prixTTC} Ariary. Consommation journalière maximale : ${data.consommationJour} kWh`
  }else if (modeGestionId === 2) {  // normal
    messagePrompt = `Votre consommation est limité maintenant à ${data.consommationNormal}Kwh`
  }else { // performance
    messagePrompt = `Votre consommation est limité ${data.consommationNormal}Kwh en mode performance`
  }

  // Ajouter une instruction pour ChatGPT de reformuler ce message pour le rendre plus clair
  const contextDescription = `
    Reformule le message suivant pour le rendre plus clair, concis. 
    La réponse doit être toujours en français.
    Message : "${messagePrompt}"
  `;


  try {
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4',
        messages: [
          { role: 'system', content: contextDescription }, // Ajouter la description comme message de contexte
        ],
        max_tokens: 100, // Limitez le nombre de tokens pour les réponses suivantes
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    let reply = response.data.choices[0].message.content;
    
    return { msg: reply };
  } catch (error) {
    return { messageError: `Error calling OpenAI API : ${error.response ? error.response.data : error.message}` };
  }
}





/**
 * SurPuissance IA
 */
export async function surPuissanceIA(data) {

    // Déterminez le message de base en fonction de la valeur du seuil
    let messagePrompt = `Attention, la puissance consommée dépasse le ${data.limite}W. Veuillez vérifier vos appareils et ajuster votre utilisation pour éviter toute surcharge sur l'appareil "${data.kit}" .`;
  
    // Ajouter une instruction pour ChatGPT de reformuler ce message pour le rendre plus clair
    const contextDescription = `
      Reformule le message suivant pour le rendre plus clair, concis, et en variant les réponses. 
      Message : "${messagePrompt}"
    `;
  
  
    try {
      const response = await axios.post(
        OPENAI_API_URL,
        {
          model: 'gpt-4',
          messages: [
            { role: 'system', content: "Vous êtes un assistant qui reformule des messages pour les rendre plus clairs et plus simples." },
            { role: 'user', content: contextDescription },
          ],
          max_tokens: 100,
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
  
      let reply = response.data.choices[0].message.content;
      return { message: reply };
    } catch (error) {
      return { messageError: `Error calling OpenAI API : ${error.response ? error.response.data : error.message}` };
    }
}



/**
 * SurIntensite IA
 * 
 */
export async function surIntensiteIA(data) {

    let messagePrompt = `Une surintesité de ${data.limite}A est détecté par l'appareil '${data.kit}'.Veuillez vérifier vos appareils et ajuster votre utilisation pour éviter toute surcharge.`;
  
    const contextDescription = `
      Reformule le message suivant pour le rendre plus clair, concis, et en variant les réponses. 
      Message : "${messagePrompt}"
    `;
  
  
    try {
      const response = await axios.post(
        OPENAI_API_URL,
        {
          model: 'gpt-4',
          messages: [
            { role: 'system', content: "Vous êtes un assistant qui reformule des messages pour les rendre plus clairs et plus simples." },
            { role: 'user', content: contextDescription },
          ],
          max_tokens: 100,
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
  
      let reply = response.data.choices[0].message.content;
      return { message: reply };
    } catch (error) {
      return { messageError: `Error calling OpenAI API : ${error.response ? error.response.data : error.message}` };
    }
}



/**
 * SurTension IA
 */
export async function surTensionIA(data) {

    let messagePrompt = ""

    if(data.status === "surtension"){
        messagePrompt = `Une surtension de ${data.limite}V est détecté par l'appareil '${data.kit}'.Veuillez vérifier vos appareils et ajuster votre utilisation pour éviter toute surcharge.`;
    }else if(data.status === "baisse"){
        messagePrompt = `Une baisse tension de ${data.limite}V est détecté par l'appareil '${data.kit}'.Veuillez vérifier vos appareils et ajuster votre utilisation pour éviter toute surcharge.`;
    }
    
    const contextDescription = `
      Reformule le message suivant pour le rendre plus clair, concis, et en variant les réponses. 
      Message : "${messagePrompt}"
    `;
  
  
    try {
      const response = await axios.post(
        OPENAI_API_URL,
        {
          model: 'gpt-4',
          messages: [
            { role: 'system', content: "Vous êtes un assistant qui reformule des messages pour les rendre plus clairs et plus simples." },
            { role: 'user', content: contextDescription },
          ],
          max_tokens: 100,
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
  
      let reply = response.data.choices[0].message.content;
      return { message: reply };
    } catch (error) {
      return { messageError: `Error calling OpenAI API : ${error.response ? error.response.data : error.message}` };
    }
}




/**
 * Notification par jour
 */
export async function consommationJourIA(data) {
  console.log("data consommationJourIA : ",data);
  let messagePrompt = ""

  if(data.consommationKWh === 0 && data.seuil === 1 || data.consommationKWh === null && data.seuil === 1){
    messagePrompt = `Votre kit est hors ligne pendant ces 12 dernières heures aujourd'hui. Veuillez la vérifier`;
  }else if(data.consommationKWh === 0 && data.seuil === 2 || data.consommationKWh === null && data.seuil === 2){
    messagePrompt = `Votre kit est hors ligne pendant ces 24 dernières heures aujourd'hui. Veuillez la vérifier`;
  }
  else if(data.seuil === 1){
      messagePrompt = `Votre consommation électrique des 12 dernières heures aujourd'hui s'élève à ${data.consommationKWh}KWh (${data.prix}Ariary).`;
  }else if(data.seuil === 2){
      messagePrompt = `Vous avez consommé ${data.consommationKWh}kWh pour un coût de ${data.prix}Ariary aujourd'hui.`;
  }
  
  const contextDescription = `
    Reformule le message suivant pour le rendre plus clair, concis.
    Les réponses doivent être toujours en français. 
    Message : "${messagePrompt}"
  `;


  try {
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4',
        messages: [
          { role: 'system', content: "Vous êtes un assistant qui reformule des messages pour les rendre plus clairs et plus simples." },
          { role: 'user', content: contextDescription },
        ],
        max_tokens: 100,
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    let reply = response.data.choices[0].message.content;
    return { message: reply };
  } catch (error) {
    return { messageError: `Error calling OpenAI API : ${error.response ? error.response.data : error.message}` };
  }
}



/**
 * Notification par semaine
 */
export async function consommationSemaineIA(data) {
  let messagePrompt = ""

  if(data.consommationKWhAvant > data.consommationKWhNow){
      messagePrompt = `Félicitations ! Votre consommation électrique a diminué cette semaine. Vous avez consommé ${data.consommationKWhNow}Kwh, contre ${data.consommationKWhAvant}KWh la semaine dernière.`;
  }else if(data.seuil === 2){
      messagePrompt = `Votre consommation électrique a légèrement augmenté cette semaine. Vous avez utilisé ${data.consommationKWhNow}KWh, contre ${data.consommationKWhAvant}KWh la semaine dernière.`;
  }
  
  const contextDescription = `
    Reformule le message suivant pour le rendre plus clair, concis.
    Les réponses doivent être toujours en français. 
    Message : "${messagePrompt}"
  `;


  try {
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4',
        messages: [
          { role: 'system', content: "Vous êtes un assistant qui reformule des messages pour les rendre plus clairs et plus simples." },
          { role: 'user', content: contextDescription },
        ],
        max_tokens: 100,
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    let reply = response.data.choices[0].message.content;
    return { message: reply };
  } catch (error) {
    return { messageError: `Error calling OpenAI API : ${error.response ? error.response.data : error.message}` };
  }
}