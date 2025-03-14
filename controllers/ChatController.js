import dotenv from 'dotenv';
import axios from 'axios';
import { data } from '../data/data.js';

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
// const OPENAI_API_URL = 'https://api.openai.com/v1/assistants'
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const port_ecozipo = process.env.PORT_ECOZIPO;

export const chat = async (req, res) => {
  const { message } = req.body;
  let data = {
    pseudo : message
  }

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

//   const data = await axios.post(`${port_ecozipo}/getstatisticskitbyyears`, {device_id : "bfa3dc80b4e3d59749zxqg", years: "2024", compteElectriciteEauId: "17"});
//   const data2 = await axios.post(`${port_ecozipo}/getstatisticskitbymois`, {device_id : "bfa3dc80b4e3d59749zxqg", date: "", compteElectriciteEauId: "17"});
  

//   // Définir le contexte avec les données fournies
//   const contextDescription = `
//   Voici la ${data.data.data.message} (Kwh):
//   ${Object.entries(data.data.data.result)
//     .filter(([_, valeurs]) => valeurs.consommation > 0) // Filtrer uniquement les mois avec consommation > 0
//     .map(([mois, valeurs]) => 
//       `${mois.toUpperCase()} : Consommation ${valeurs.consommation} kWh, Prix TTC ${valeurs.prixTTC} MGA`
//     )
//     .join('\n')}

//   Voici la ${data2.data.data.message} (kWh) en janvier 2025:
//   ${Object.entries(data2.data.data.result).map(([day, valeurs]) => 
//     `${day} : Consommation ${valeurs.consommation} kWh, Prix TTC ${valeurs.prixTTC} MGA`
//   ).join('\n')}
//   Les réponses ne doivent pas dépasser 30 mots.
// `;

//   console.log(contextDescription);

//   const data = await axios.post(`${port_ecozipo}/getstatisticskitbymois`, {device_id : "bfa3dc80b4e3d59749zxqg", date: "11/15/2024", compteElectriciteEauId: "17"});
//   const data2 = await axios.post(`${port_ecozipo}/getstatisticskitbymois`, {device_id : "bfa3dc80b4e3d59749zxqg", date: "12/15/2024", compteElectriciteEauId: "17"});
  

//   // Définir le contexte avec les données fournies
//   const contextDescription = `
//      Voici la ${data.data.data.message} (kWh) en novembre 2024:
//     ${Object.entries(data.data.data.result).map(([day, valeurs]) => 
//       `${day} : Consommation ${valeurs.consommation} kWh, Prix TTC ${valeurs.prixTTC} MGA`
//     ).join('\n')}

//      Voici la ${data2.data.data.message} (kWh) en décembre 2024:
//     ${Object.entries(data2.data.data.result).map(([day, valeurs]) => 
//       `${day} : Consommation ${valeurs.consommation} kWh, Prix TTC ${valeurs.prixTTC} MGA`
//     ).join('\n')}


//   Les réponses ne doivent pas dépasser 30 mots.
// `;
  


//   try {
    
//     const response = await axios.post(
//       OPENAI_API_URL,
//       {
//         model: 'gpt-4-turbo',
//         logprobs: true,
//         top_logprobs: 2,
//         messages: [
//           { role: 'assistant', content: contextDescription }, // Ajouter la description comme message de contexte
//           { role: 'user', content: `
//             - Donner la consommation différece de consommation par rapport à la mois précédente \`n
//             - Analyser la profile de consommation (donner la consommation moyenne par période dont ce qui pointe et creux avec la valeur)\`n
//             - Recommander pour économiser l'énergie
//           ` },
//         ],
//         // max_tokens: 100, // Limitez le nombre de tokens pour les réponses suivantes
//       },
//       {
//         headers: {
//           'Authorization': `Bearer ${OPENAI_API_KEY}`,
//           'Content-Type': 'application/json',
//         },
//       }
//     );

//     let reply = response.data.choices[0].message.content;

//     res.json({ message: reply });
//     // res.json({ message: "reply" })
//   } catch (error) {
//     console.error('Error calling OpenAI API:', error.response ? error.response.data : error.message);
//     res.status(500).json({ error: 'Failed to get response from OpenAI API' });
//   }
};



// export const chat = async (req, res) => {
//   const { message } = req.body;

//   // Définir le contexte avec les données fournies
//   const contextDescription = `
//   Voici les informations sur EcoZipo:
  
//   Salutation : ${data.salutation.join('\n')}

//   Au revoir : ${data['Au revoir ou A bientôt'].join('\n')}

//   message de redirection ou utilisateur est hors sujet : ${data['message de redirection'].join('\n')}
  
//   Présentation Ecozipo: ${data['presentation Ecozipo'].join('\n')}

//   Objectifs: ${data.objectif.join('\n')}

//   Impact : ${data.impact.join('\n')}

//   Services offerts par EcoZipo au nom des clients ou litige: ${data.Litige.join('n')}

//   Les fonctionnalités de l'appication : ${data['les fonctionnalités de l\'application'].join('\n')}

//   Analyses des fonctionnalités clés : \n
//     - suivi et gestion des dépenses domestique : ${data['analyses des fonctionnalités clés']['suivi et gestion des dépenses domestiques'].join('\n')}
//     - Calcul précis de la consommation d'électricité et d'eau : ${data['analyses des fonctionnalités clés']['Calcul précis de la consommation d\'électricité et d\'eau'].join('\n')}
//     - Facilitation de la recherche de professionnels certifiés : ${data['analyses des fonctionnalités clés']['Facilitation de la recherche de professionnels certifiés'].join('\n')}
//     - Offre d'un marketplace pour des produits de qualité liés à l'énergie et à l'eau : ${data['analyses des fonctionnalités clés']['Offre d\'un marketplace pour des produits de qualité liés à l\'énergie et à l\'eau'].join('\n')}
//     - Assistance via un chatbot : ${data['analyses des fonctionnalités clés']['Assistance via un chatbot'].join('\n')}
//     - Simplification du paiement des factures : ${data['analyses des fonctionnalités clés']['Simplification du paiement des factures'].join('\n')}

//   JIRAMA : ${data.JIRAMA.join('\n')}

//   Agence Jirama Antananarivo : ${data['Agence Jirama Antananarivo'].join('\n')}

//   Tarif électricité Jirama : \n
//     - 10 Social : ${data['Tarif électricité Jirama']['10 Social'].join('\n')}
//     - 20 Economique : ${data['Tarif électricité Jirama']['20 Economique'].join('\n')}
//     - 25 Confort : ${data['Tarif électricité Jirama']['25 Confort'].join('\n')}
//     - 40 super confort : ${data['Tarif électricité Jirama']['40 Super Confort'].join('\n')}

//   tarif eau Jirama : \n
//     - 50 consommation < 1000m3 : ${data['Tarif eau Jirama']['50 Consommation <1000m3'].join('\n')}
//     - 55 consommation >= 1000m3 : ${data['Tarif eau Jirama']['55 Consommation >=1000m3'].join('\n')}

//   Zone JIRAMA : ${data['Zone JIRAMA'].join('\n')}

//   Tranche JIRAMA : ${data['Tranche JIRAMA'].join('\n')}

//   Prix JIRAMA par tarif et zone : \n
//     - tarif 10 : ${data['Prix JIRAMA par tarif et zone']['tarif 10'].join('\n')}
//     - tarif 20 : ${data['Prix JIRAMA par tarif et zone']['tarif 20'].join('\n')}
//     - tarif 25 : ${data['Prix JIRAMA par tarif et zone']['tarif 25'].join('\n')}
//     - tarif 40 : ${data['Prix JIRAMA par tarif et zone']['tarif 40'].join('\n')}

//   Calcul facture JIRAMA : ${data['Calcul facture JIRAMA'].join('\n')}

//  Tu devras capable de répondre aux questions liées à l'électricité et plomberie ou des matérielles électriques ou plomberie.
//  Les réponses doivent se limiter aux informations ci-dessus.
//  Les réponses ne doivent pas dépasser de 30 mots.
//   `;

//   // const keywords = extractKeywords(contextDescription);

//   // Fonction pour vérifier si le message de l'utilisateur est lié aux données
//   const isOnTopic = (message) => {
//     const allData = [
//         ...data.salutation, 
//         ...data['Au revoir ou A bientôt'],
//         ...data['message de redirection'],
//         ...data['presentation Ecozipo'], 
//         ...data.objectif,
//         ...data.impact,
//         ...data.Litige,
//         ...data['analyses des fonctionnalités clés']['suivi et gestion des dépenses domestiques'],
//         ...data['analyses des fonctionnalités clés']['Calcul précis de la consommation d\'électricité et d\'eau'],
//         ...data['analyses des fonctionnalités clés']['Facilitation de la recherche de professionnels certifiés'],
//         ...data['analyses des fonctionnalités clés']['Offre d\'un marketplace pour des produits de qualité liés à l\'énergie et à l\'eau'],
//         ...data['analyses des fonctionnalités clés']['Assistance via un chatbot'],
//         ...data['analyses des fonctionnalités clés']['Simplification du paiement des factures'],
//         ...data['les fonctionnalités de l\'application'],
//         ...data.JIRAMA,
//         ...data['Agence Jirama Antananarivo'],
//         ...data['Tarif électricité Jirama']['10 Social'],
//         ...data['Tarif électricité Jirama']['20 Economique'],
//         ...data['Tarif électricité Jirama']['25 Confort'],
//         ...data['Tarif électricité Jirama']['40 Super Confort'],
//         ...data['Tarif eau Jirama']['50 Consommation <1000m3'],
//         ...data['Tarif eau Jirama']['55 Consommation >=1000m3'],
//         ...data['Zone JIRAMA'],
//         ...data['Tranche JIRAMA'],
//         ...data['Prix JIRAMA par tarif et zone']['tarif 10'],
//         ...data['Prix JIRAMA par tarif et zone']['tarif 20'],
//         ...data['Prix JIRAMA par tarif et zone']['tarif 25'],
//         ...data['Prix JIRAMA par tarif et zone']['tarif 40'],
//         ...data['Calcul facture JIRAMA']
      

//     ].join(' ').toLowerCase();
//     return message.toLowerCase().split(' ').some(word => allData.includes(word));
//   };

//   // Vérifiez si le message de l'utilisateur est lié aux données
//   if (!isOnTopic(message)) {
//     return res.json({ message: "Je suis désolé, je n'ai pas la réponse à cette question. Souhaitez-vous entrer en contact avec notre support client pour obtenir de l'aide ?" });
//   }

//   try {
//     const response = await axios.post(
//       OPENAI_API_URL,
//       {
//         model: 'gpt-4',
//         messages: [
//           { role: 'system', content: contextDescription }, // Ajouter la description comme message de contexte
//           { role: 'user', content: message }
//         ],
//         max_tokens: 100, // Limitez le nombre de tokens pour les réponses suivantes
//       },
//       {
//         headers: {
//           'Authorization': `Bearer ${OPENAI_API_KEY}`,
//           'Content-Type': 'application/json',
//         },
//       }
//     );

//     let reply = response.data.choices[0].message.content;

//     // Utilisation de nltk pour diviser le texte en phrases
//     // const sentences = nltk.sent_tokenize(reply);

//     // Rassembler les phrases jusqu'à ce que le nombre maximum de mots soit atteint
//     // let summary = '';
//     // let wordCount = 0;
//     // const maxWords = 30;

//     // for (let sentence of sentences) {
//     //   const words = sentence.split(' ');
//     //   if (wordCount + words.length <= maxWords) {
//     //     summary += sentence + ' ';
//     //     wordCount += words.length;
//     //   } else {
//     //     break;
//     //   }
//     // }

//     res.json({ message: reply });
//   } catch (error) {
//     console.error('Error calling OpenAI API:', error.response ? error.response.data : error.message);
//     res.status(500).json({ error: 'Failed to get response from OpenAI API' });
//   }
// };


export async function ReponseIAKit(data) {

  // Déterminez le message de base en fonction de la valeur du seuil
  let messagePrompt = '';
  if (data.seuil === 1) {
    messagePrompt = `Alerte ! Vous approchez de votre limite de consommation d'électricité de la journée à ${data.consommationJour}kWh. Jusqu'à présent, vous avez consommé ${data.kWhJour}kWh coûtant ${data.prixParJour}Ar. Ajustez votre utilisation avec notre application pour économiser.`;
  } else if (data.seuil === 2) {
    messagePrompt = `Attention ! Vous avez atteint votre seuil de consommation de ${data.consommationJour}kWh pour aujourd'hui, avec un coût de ${data.prixParJour}Ar. Continuez à surveiller et réduire votre utilisation pour maîtriser vos coûts.`;
  } else if (data.seuil === 3) {
    messagePrompt = `Alerte critique ! Votre consommation d'énergie a dépassé le seuil de ${data.consommationJour}kWh aujourd'hui. Vous avez dépensé ${data.prixParJour}Ar. Utilisez nos conseils pour limiter les coûts supplémentaires.`;
  }

  // Ajouter une instruction pour ChatGPT de reformuler ce message pour le rendre plus clair
  const contextDescription = `
    Reformule le message suivant pour le rendre plus clair, concis, et en variant les réponses. 
    L'utilisateur utilise déjà l'application, alors incitez-le à réduire sa consommation en éteignant des appareils énergivores, par exemple.
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



