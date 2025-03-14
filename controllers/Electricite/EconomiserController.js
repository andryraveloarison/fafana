import { PrismaClient } from '@prisma/client'
import { CalculTKwhEnAriaryTTC } from '../JiramaCalculController.js';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const prisma = new PrismaClient()

export const Economiser = async(req, res) =>{
  try {
    const { compteElectriciteEauId, KwhConsomme, jourConsommation, nbrAdulte, nbrEnfant} = req.body

    if(!compteElectriciteEauId) return res.status(400).json({ message: "Veuillez ajouter le compte électricité eau", status: false })
    if(!KwhConsomme) return res.status(400).json({ message: "Veuillez ajouter le nombre de kWh consommé", status: false })
    if(!jourConsommation) return res.status(400).json({ message: "Veuillez ajouter le nombre de jours consommé", status: false })
    if(!nbrAdulte) return res.status(400).json({ message: "Veuillez ajouter le nombre d'adulte", status: false })
    if(!nbrEnfant) return res.status(400).json({ message: "Veuillez ajouter le nombre d'enfant", status: false })
    if(parseInt(nbrAdulte) === 0 || parseInt(nbrAdulte) < 0) return res.status(400).json({ message: "Le nombre d'adulte ne peut pas être égal ou inférieur à 0", status: false })
    if(parseInt(nbrEnfant) < 0) return res.status(400).json({ message: "Le nombre d'enfant ne peut pas être inférieur à 0", status: false })

    // get CompteElectriciteEau
    const compteElectriciteEau = await prisma.compteElectriciteEau.findUnique({
      where: {
        id: parseInt(compteElectriciteEauId)
      }
    })
    if (!compteElectriciteEau) return res.status(404).json({ message: "Compte introuvable", status: false })

    let tarif = parseInt(compteElectriciteEau.tarif)
    let utilisateurId = parseInt(compteElectriciteEau.utilisateurId)
    
    
    // calcul kwh
    const prix = await CalculTKwhEnAriaryTTC(compteElectriciteEau.id, KwhConsomme)
    let consommationNormal = 0
    let prixNormal = 0
    let msg = ''
    let data = {}

    // tarif social
    if(tarif === 10){
      let consommationNormalAdulte = 3 + (parseInt(nbrAdulte) - 1)
      let consommationNormalEnfant = 0
      if(nbrEnfant > 0) consommationNormalEnfant = 2 + ((parseInt(nbrEnfant) - 1) / 2)
      consommationNormal = consommationNormalAdulte + consommationNormalEnfant
      consommationNormal = consommationNormal * jourConsommation
      const calculPrixNormal = await CalculTKwhEnAriaryTTC(compteElectriciteEau.id, consommationNormal)
      prixNormal = calculPrixNormal.data.prixTTC

      prix.data = {
        ...prix.data,
        tarif : tarif,
        jourConsommation: jourConsommation,
        nbrAdulte: nbrAdulte,
        nbrEnfant: nbrEnfant,
        consommationNormal: consommationNormal,
        prixNormal: prixNormal
      }
      data = prix.data
      const reponseIAEconomiser = await ReponseIAEconomiser(prix.data)
      msg = reponseIAEconomiser.message
    }else if(tarif === 20){
      let consommationNormalAdulte = 7 + ((parseInt(nbrAdulte) - 1) * 1.5)
      
      let consommationNormalEnfant = 0
      if(nbrEnfant > 0) consommationNormalEnfant = 3 + (((parseInt(nbrEnfant) - 1) * 1.5)/2)
      
      consommationNormal = consommationNormalAdulte + consommationNormalEnfant
      consommationNormal = consommationNormal * jourConsommation
      const calculPrixNormal = await CalculTKwhEnAriaryTTC(compteElectriciteEau.id, consommationNormal)
      prixNormal = calculPrixNormal.data.prixTTC

      prix.data = {
        ...prix.data,
        tarif : tarif,
        jourConsommation: jourConsommation,
        nbrAdulte: nbrAdulte,
        nbrEnfant: nbrEnfant,
        consommationNormal: consommationNormal,
        prixNormal: prixNormal
      }
      data = prix.data
      const reponseIAEconomiser = await ReponseIAEconomiser(prix.data)
      msg = reponseIAEconomiser.message
    }else {
      msg = "Ce tarif ne s'applique pas à la partie économique de votre abonnement. Veuillez contacter notre service client pour plus d'informations. "
      data = []
    }

    res.status(200).json({
      data : data,
      msg : msg,
      status: true
    })
   
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
}


export async function ReponseIAEconomiser(data) {

  let messagePrompt = '';
  // if (parseInt(data.consommation) > data.consommationNormal) {
  //   messagePrompt = `Votre consommation d'électricité pour le tarif ${data.tarif} a largement dépassé les prévisions. Un foyer de ${data.nbrAdulte} adultes et ${data.nbrEnfant} enfants, avec un usage normal, ne devrait pas dépasser ${data.consommationNormal}kWh (${data.prixNormal}Ariary) en ${data.jourConsommation} jours. Or, votre consommation réelle a atteint ${data.consommation}kWh (${data.prixTTC} Ariary). Une vérification de vos appareils électriques est fortement recommandée`
  // } else  {
  //   messagePrompt = `Nous sommes très satisfaits de votre consommation d'énergie. Chaque geste compte. Continuez ainsi et vous constaterez rapidement de nouvelles économies.`;
  // } 
  if (parseInt(data.consommation) > data.consommationNormal) {
    messagePrompt = `Vous pouvez faire mieux ! Votre consommation dépasse les standards EcoZipo. Explorez nos astuces pour réduire votre empreinte énergétique.`
  } else  {
    messagePrompt = `Nous sommes très satisfaits de votre consommation d'énergie. Chaque geste compte. Continuez ainsi et vous constaterez rapidement de nouvelles économies.`;
  } 
  const contextDescription = `
    Reformule le message suivant pour le rendre plus clair, concis, et en variant les réponses, ne précise pas que message reformule, juste la réponse 
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