import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv';
import axios from 'axios'
import axiosRetry from 'axios-retry'
import crypto from 'crypto';
import { getTokens } from '../../utils/tokenStore.js';
import { GenerateSign } from '../ConfigController.js';
import { functionGetStatisticsKitTongou, functionGetStatusKitTongou, getDateFormated, getTodayDateFormatted } from './KitTongouController.js';
import { CalculTKwhEnAriaryTTC, CalculTroisDernierFacture } from '../JiramaCalculController.js';
import { ReponseIAKit } from '../ChatController.js';
import { ReponseIACreateKitUser, updateModeGestionIA } from './KitTongouIAController.js';

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
 * UPDATE CONSOMMATION MOIS 
 */
export const updateFactureMoisCompte = async (req, res) => {
  try {

    const compteElectriciteEauId = req.body.compteElectriciteEauId;
    const {mois1, mois2, mois3} = req.body;
    
    if(!mois1 || !mois2 || !mois3) return res.status(400).json({ message: "Les factures du 3 derniers mois sont obligatoires.", success: false });
    if(!compteElectriciteEauId) return res.status(400).json({ message: "Le 'compteElectriciteEauId' est obligatoire.", success: false });

    const compteElectriciteEauExits = await prisma.compteElectriciteEau.findUnique({ 
      where: { id: parseFloat(compteElectriciteEauId) }
    });
    if (!compteElectriciteEauExits) return res.status(400).json({ message: "Le compte électrique n'existe pas.", success: false });


    // update compteElectriciteEau
    const updateCompte = await prisma.compteElectriciteEau.update({
      where: {
        id: parseFloat(compteElectriciteEauId)
      },
      data: {
        mois1: parseFloat(mois1),
        mois2: parseFloat(mois2),
        mois3: parseFloat(mois3),
      },
      include: {
        Utilisateur: true
      }
    });
    res.status(201).json({
      message: "Compte électrique mis à jour",
      Data: updateCompte,
      success: true
    });

  } catch (error) {
    console.error("Erreur lors de la mise à jour du compte électrique :", error.message);
    res.status(500).json({ message: error.message, success: false });
  }
};




/**
 * UPDATE DATE RELEVE 
 */
export const updateDateReleveCompte = async (req, res) => {
  try {

    const compteElectriciteEauId = req.body.compteElectriciteEauId;
    let date  = req.body.date;
    let joursConsommation = req.body.joursConsommation;
    let consommationInitial = req.body.consommationInitial
    
    if(!date) return res.status(400).json({ message: "Veuillez ajouter la date de votre nouveau index sur votre ancien facture.", success: false });
    if(!joursConsommation) return res.status(400).json({ message: "Le nombre de jours de votre consommation est obligatoire.", success: false });
    if(!compteElectriciteEauId) return res.status(400).json({ message: "Le 'compteElectriciteEauId' est obligatoire.", success: false });
    if(!consommationInitial) return res.status(400).json({ message: "La consommation du compteur actuelle est obligatoire.", success: false });

    if(joursConsommation < 28) return res.status(400).json({ message: "Le nombre de jours de votre consommation doit être supérieur à 28 jours.", success: false }); 
    if(joursConsommation > 33) return res.status(400).json({ message: "Le nombre de jours de votre consommation doit être inférieur à 31 jours.", success: false });

    const compteElectriciteEauExits = await prisma.compteElectriciteEau.findUnique({ 
      where: { id: parseFloat(compteElectriciteEauId) }
    });
    if (!compteElectriciteEauExits) return res.status(400).json({ message: "Le compte électrique n'existe pas.", success: false });

    
    let date_formated = await getDateFormated(date);
    date = date_formated.date;

    // update compteElectriciteEau
    const updateCompte = await prisma.compteElectriciteEau.update({
      where: {
        id: parseFloat(compteElectriciteEauId)
      },
      data: {
        dateReleve: date,
        joursConsommation: parseInt(joursConsommation),
        consommationInitial: parseFloat(consommationInitial)
      }
    });
    res.status(201).json({
      message: "Date relevé mis à jour",
      Data: updateCompte,
      success: true
    });

  } catch (error) {
    console.error("Erreur lors de la mise à jour du compte électrique :", error.message);
    res.status(500).json({ message: error.message, success: false });
  }
};




/**
 * UPDATE DATE RELEVE, CONSOMMATION MOIS 
 */
export const getAddDateReleveFactureMois = async (req, res) => {
  try {

    const compteElectriciteEauId = req.body.compteElectriciteEauId;
    const {mois1, mois2, mois3} = req.body;
    let date  = req.body.date;
    let joursConsommation = req.body.joursConsommation;
    let consommationInitial = req.body.consommationInitial
    
    if(!date) return res.status(400).json({ message: "Veuillez ajouter la date de votre nouveau index sur votre ancien facture.", success: false });
    if(!mois1 || !mois2 || !mois3) return res.status(400).json({ message: "Les factures du 3 derniers mois sont obligatoires.", success: false });
    if(!joursConsommation) return res.status(400).json({ message: "Le nombre de jours de votre consommation est obligatoire.", success: false });
    if(!compteElectriciteEauId) return res.status(400).json({ message: "Le 'compteElectriciteEauId' est obligatoire.", success: false });
    if(joursConsommation < 28) return res.status(400).json({ message: "Le nombre de jours de votre consommation doit être supérieur à 28 jours.", success: false }); 
    if(joursConsommation > 33) return res.status(400).json({ message: "Le nombre de jours de votre consommation doit être inférieur à 31 jours.", success: false });
    if(!consommationInitial) return res.status(400).json({ message: "La consommation du compteur actuelle est obligatoire.", success: false });


    const compteElectriciteEauExits = await prisma.compteElectriciteEau.findUnique({ 
      where: { id: parseFloat(compteElectriciteEauId) }
    });
    if (!compteElectriciteEauExits) return res.status(400).json({ message: "Le compte électrique n'existe pas.", success: false });

    
    let date_formated = await getDateFormated(date);
    date = date_formated.date;

    // update compteElectriciteEau
    const updateCompte = await prisma.compteElectriciteEau.update({
      where: {
        id: parseFloat(compteElectriciteEauId)
      },
      data: {
        mois1: parseFloat(mois1) || null,
        mois2: parseFloat(mois2),
        mois3: parseFloat(mois3),
        dateReleve: date,
        joursConsommation: parseInt(joursConsommation),
        consommationInitial: parseFloat(consommationInitial)
      }
    });
    res.json({
      Msg: "Vous compte électrique a été mis à jour",
      Data: updateCompte,
      success: true
    });

  } catch (error) {
    console.error("Erreur lors de la mise à jour du compte électrique :", error);
    res.status(500).json({ messageError: 'Erreur serveur', success: false });
  }
};
