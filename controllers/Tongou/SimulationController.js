import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv';
import axios from 'axios'
import { CalculTKwhEnAriaryTTC } from '../JiramaCalculController.js';


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


/**
 * Make simulation
 */
export const makeSimulationKit = async (req, res) => {
  try {
    let data = req.body
    /*let utilisateurId = data.utilisateurId
    let reference = data.reference
    let type = data.type
    let liste = data.liste
    let nbr = data.nbr

    console.log(utilisateurId)

    let materiels = ""

    // console.log("liste : ",liste.length);
    // console.log("liste : ",liste[0]);

    liste.forEach((item) => {
      for (const key in item) {
        materiels = materiels+key+"("+item[key]+"),"
      }
    });

    let credantials = {
          materiels: materiels, 
          type: type, 
          nbPersonne: nbr, 
          utilisateurId: utilisateurId
    }*/
          console.log("*** SIMULATION *******")

    let response = await axios.post(`${port_ia}/simulation`, data );
    console.log("*** reponsz *******")

    
    // for (let index = 0; index < liste.length; index++) {
    //   let list = liste[index]
    //   console.log("list : ",list);
    //   response = response+";"+list
    // }
    
    //console.log(response);
    

    res.status(200).json({
      Msg: "Simulation dépense",
      Data: data,
      success: true
    });

  } catch (error) {
    console.error(`Erreur lors du simulation, `,error.message)
    console.log("error")
    res.status(500).json({ 
      message: error.message,
      success: false
    });
  }
};






/***
 * 
 * send notification Simulation
 */
export const sendNotificationSimulation = async (req, res) => {
  try {



    console.log(req.body)
    const { utilisateurId, totalPersonne, nbEnfant, nbAdulte, consommation, listeAppareil, recommandation, tarif } = req.body;  

    if(utilisateurId && totalPersonne && nbEnfant && nbAdulte && consommation && listeAppareil && recommandation && tarif){
     // Récupérer l'ID de la simulation existante pour l'utilisateur
     const existingSimulation = await prisma.simulationia.findFirst({
      where: { utilisateurId: parseInt(utilisateurId) },
      select: { id: true },
    });

    let depense = await CalculTKwhEnAriaryTTC(17, consommation)
    depense = depense.data.prixTTC.toFixed(2)

    const updatedSimulation = await prisma.simulationia.upsert({
      where: existingSimulation ? { id: existingSimulation.id } : { utilisateurId: parseInt(utilisateurId) },
      update: {
        totalPersonne: totalPersonne,
        nbEnfant: nbEnfant,
        nbAdulte: nbAdulte,
        consommation: consommation,
        listeAppareil: listeAppareil,
        recommandation: recommandation,
        tarif: tarif, 
        depense: depense
      },
      create: {
        titre: "Simulation consommation",
        totalPersonne: totalPersonne,
        nbEnfant: nbEnfant,
        nbAdulte: nbAdulte,
        consommation: consommation,
        listeAppareil: listeAppareil,
        recommandation: recommandation,
        tarif: tarif,   
        depense: depense,
        utilisateurId: parseInt(utilisateurId),
      },
    });

      await prisma.notification.create({
        data: {
          titre: "Votre Simulation!",
          description: "Votre simulation a été effectuer cliquer pour voir le resultat",
          type: "simulation",
          isSonor: true,
          isTouched: true,
          utilisateurId: parseInt(utilisateurId),
        }
      })

      console.log(updatedSimulation)
      console.log("*** NOTIFICATION *******")
      let id = parseInt(utilisateurId)
      req.io.emit('notifSimulationIA', {
        utilisateurId : id,
        simulation: "Votre Simulation!"
      });

      console.log("*** NOTIFICATION *******")
      /*console.log("analyse : ",analyse);*/


    }else {
      console.log("tsisy donnée");
    }
   

    return res.status(201).json({
      simulation: "Simulation en cours",
      utilisateurId: utilisateurId,
      success: true
    });

  } catch (error) {
    console.error("Erreur lors de l'envoi de la notification par semaine", error);
    res.status(500).json({
      message: "Erreur lors de l'envoi de la simulation",
      error: error.message,
      success: false
    });
  }
};




/***
 * 
 * GET SIMULATION BY ID
 */
export const getSimulationById = async (req, res) => {
  try {

    const { utilisateurId } = req.body;  

    const simulation = await prisma.simulationia.findFirst({
      where: { utilisateurId: utilisateurId },
    })


    return res.status(201).json({
      simulation: simulation,
      success: true
    });

  } catch (error) {
    console.error("Erreur lors de la recuperation des type home", error);
    res.status(500).json({
      message: "Erreur lors de la recuperation",
      error: error.message,
      success: false
    });
  }
};
