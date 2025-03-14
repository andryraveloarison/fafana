import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv';
import { CalculConsommationParModeGestion } from '../Electricite/CompteElectriciteEauController.js';
import { updateConsommationMinKitValeurIA, updateModeGestionIA } from './KitTongouIAController.js';
import { CalculTroisDernierFacture } from '../JiramaCalculController.js';


config();

const prisma = new PrismaClient()



/**
 * UPDATE LIMITE BUT
 */

export const updateConsommationMinInKitValeurBut = async (req, res) => {
  try {
    let { device_id, consommationMin } = req.body;
    if(!device_id) return res.status(400).json({ message: "Le idKitTongou est obligatoire.", success: false });
    if(!consommationMin) return res.status(400).json({ message: "La consommationMin est obligatoire.", success: false });
    
    // find id kittongou
    const kitTongouExits = await prisma.kitTongou.findFirst({ 
      where: { idKitTongou: device_id }
    });
    if(!kitTongouExits) return res.status(400).json({ message: "Le kit tongou n'existe pas.", success: false });

    

    // find info in kitTongouUser
    const kitTongouUser = await prisma.kitTongouUser.findFirst({
      where: {
        kitTongouId: kitTongouExits.id
      }
    });

    let kitTongouId = kitTongouExits.id
    let compteElectriciteEauId = kitTongouUser.compteElectriciteEauId


    // get compteElectricite
    const compteElectricite = await prisma.compteElectriciteEau.findUnique({
      where: {
        id: parseFloat(compteElectriciteEauId)
      }
    });
    if(!compteElectricite) return res.status(404).json({ message: "Le compte électrique n'existe pas." });
    let zoneId = compteElectricite.zoneId
    let tarif = compteElectricite.tarif

    const prix = await prisma.prix.findFirst({
      where: {
        AND: [
          { zoneId: zoneId },
          { tarif: tarif }
        ]
      }
    });
    let limiteQ1 = prix.q1
    if(kitTongouExits.kitTypeId === 1) { // si kit est disjoncteur
      if(consommationMin < limiteQ1) return res.status(400).json({ message: `La limite doit être supérieure à ${limiteQ1}Kwh.`, success: false });
    }else { // si secteur
      if(consommationMin < 0) return res.status(400).json({ message: "La consommationMin doit être supérieure à 0.", success: false });
    }



    // find kitvaleurbutId
    const kitValeurBut = await prisma.kitValeurBut.findFirst({
      where: {
        kitTongouId: kitTongouId
      }
    });
    if(!kitValeurBut) return res.status(404).json({ message: "Le kit valeur but n'existe pas." });
  

    

    /**
     * calcule les trois derniers factures de l'utilisateur
     */
    let consommation = consommationMin
    let modeGestionId = kitValeurBut.modeGestionId
    
    let calculConsommation = await CalculConsommationParModeGestion(compteElectriciteEauId, consommation, parseInt(modeGestionId));
    if (calculConsommation.messageError) return res.status(400).json({ messageError: calculConsommation.messageError });  
      
    
    consommationMin = calculConsommation.data.min
    let tranche = calculConsommation.data.tranche
    let pourcentageTranche = calculConsommation.data.valeurEconomiser.toString()+"%"
    let consommationBut = calculConsommation.data.consommationNormal
    let consommationJour = calculConsommation.data.consommationJour
    let consommationHeure = calculConsommation.data.consommationHeure

   

    // send IA to user
    let analyseIA = await updateConsommationMinKitValeurIA(calculConsommation.data, modeGestionId);
    let message = ""
    if (analyseIA.messageError) message = "Consommation minimum mise à jour"
    else message = analyseIA.msg
    // console.log("analyseIA : ",analyseIA.msg)
    
    
    // update kitvaleurbut
    const updateCompte = await prisma.kitValeurBut.update({
      where: {
        id: kitValeurBut.id
      },
      data: {
        status: true,
        consommationMin: parseFloat(consommationMin),
        tranche: tranche,
        pourcentageTranche: pourcentageTranche,
        consommationBut: consommationBut,
        consommationJour: consommationJour,
        consommationHeure: consommationHeure,
        msg1: false,
        msg2: false,
        msg3: false,
        typeValeurBut: true,
        modeGestionId: parseInt(modeGestionId)
      }
    });


    // const newNotif = await prisma.notification.create({
    //   data:{
    //       message: message,
    //       type: "IA",
    //       utilisateurId : compteElectricite.utilisateurId
    // }})
    // // console.log("newNotif : ",newNotif)
    // req.io.emit('notifIA', newNotif);


    res.json({
      Msg: `Votre kit est limité à ${consommationMin}kWh`,
      Data: updateCompte,
      success: true
    });

  } catch (error) {
    console.error("Erreur API updateConsommationMinInKitValeurBut:", error);
    res.status(500).json({ messageError: error.message, success: false });
  }
};



/**
 * UPDATE LIMITE BUT
 */

export const desactiverConsommationPersonnalisseInKitValeurBut = async (req, res) => {
  try {
    let { device_id } = req.body;
    if(!device_id) return res.status(400).json({ message: "Le idKitTongou est obligatoire.", success: false });

    // find id kittongou
    const kitTongouExits = await prisma.kitTongou.findFirst({ 
      where: { idKitTongou: device_id }
    });
    if(!kitTongouExits) return res.status(400).json({ message: "Le kit tongou n'existe pas.", success: false });

    

    // find info in kitTongouUser
    const kitTongouUser = await prisma.kitTongouUser.findFirst({
      where: {
        kitTongouId: kitTongouExits.id
      }
    });

    let kitTongouId = kitTongouExits.id
    let compteElectriciteEauId = kitTongouUser.compteElectriciteEauId


    // get compteElectricite
    const compteElectricite = await prisma.compteElectriciteEau.findUnique({
      where: {
        id: parseFloat(compteElectriciteEauId)
      }
    });
    if(!compteElectricite) return res.status(404).json({ message: "Le compte électrique n'existe pas." });
    

    // find kitvaleurbutId
    const kitValeurBut = await prisma.kitValeurBut.findFirst({
      where: {
        kitTongouId: kitTongouId
      }
    });
    if(!kitValeurBut) return res.status(404).json({ message: "Le kit valeur but n'existe pas." });
  

    

    /**
     * calcule les trois derniers factures de l'utilisateur
     */
    let modeGestionId = kitValeurBut.modeGestionId
    
    let calculConsommation = await CalculTroisDernierFacture(compteElectriciteEauId, parseInt(modeGestionId));
    if (calculConsommation.messageError) return res.status(400).json({ messageError: calculConsommation.messageError }); 
      
    
    let consommationMin = calculConsommation.data.min
    let tranche = calculConsommation.data.tranche
    let pourcentageTranche = calculConsommation.data.valeurEconomiser.toString()+"%"
    let consommationBut = calculConsommation.data.consommationNormal
    let consommationJour = calculConsommation.data.consommationJour
    let consommationHeure = calculConsommation.data.consommationHeure

   

    // send IA to user
    let analyseIA = await updateConsommationMinKitValeurIA(calculConsommation.data, modeGestionId);
    let message = ""
    if (analyseIA.messageError) message = "Limite désactivée"
    else message = analyseIA.msg
    // console.log("analyseIA : ",analyseIA.msg)
    
    
    // update kitvaleurbut
    const updateCompte = await prisma.kitValeurBut.update({
      where: {
        id: kitValeurBut.id
      },
      data: {
        status: true,
        consommationMin: parseFloat(consommationMin),
        tranche: tranche,
        pourcentageTranche: pourcentageTranche,
        consommationBut: consommationBut,
        consommationJour: consommationJour,
        consommationHeure: consommationHeure,
        msg1: false,
        msg2: false,
        msg3: false,
        typeValeurBut: false,
        modeGestionId: parseInt(modeGestionId)
      }
    });


    // const newNotif = await prisma.notification.create({
    //   data:{
    //       message: message,
    //       type: "IA",
    //       utilisateurId : compteElectricite.utilisateurId
    // }})
    // // console.log("newNotif : ",newNotif)
    // req.io.emit('notifIA', newNotif);


    res.json({
      Msg: `Votre kit est limité à ${consommationMin}kWh`,
      Data: updateCompte,
      success: true
    });

  } catch (error) {
    res.status(500).json({ messageError: error.message, success: false });
  }
};




/**
 * UPDATE MODE GESTION COMPTE
 */
export const updateModeGestionKit = async (req, res) => {
  try {
    const { modeGestionId, device_id} = req.body;
    if(!device_id) return res.status(400).json({ message: "Le idKitTongou est obligatoire.", success: false });
    if(!modeGestionId) return res.status(400).json({ message: "Le mode gestion est obligatoire.", success: false });

    // find id kittongou
    const kitTongouExits = await prisma.kitTongou.findFirst({ 
      where: { idKitTongou: device_id }
    });
    if(!kitTongouExits) return res.status(400).json({ message: "Le kit tongou n'existe pas.", success: false });

    

    // find info in kitTongouUser
    const kitTongouUser = await prisma.kitTongouUser.findFirst({
      where: {
        kitTongouId: kitTongouExits.id
      }
    });

    let kitTongouId = kitTongouExits.id
    let compteElectriciteEauId = kitTongouUser.compteElectriciteEauId

    const modeGestionExits = await prisma.modeGestion.findUnique({ 
      where: { id: parseFloat(modeGestionId) }
    });
    if(!modeGestionExits) return res.status(404).json({ message: "Le mode gestion n'existe pas." });

    
    // get compteElectricite
    const compteElectricite = await prisma.compteElectriciteEau.findUnique({
      where: {
        id: parseFloat(compteElectriciteEauId)
      }
    });
    if(!compteElectricite) return res.status(404).json({ message: "Le compte électrique n'existe pas." });
    

    // find kitvaleurbutId
    const kitValeurBut = await prisma.kitValeurBut.findFirst({
      where: {
        kitTongouId: kitTongouId
      }
    });
    if(!kitValeurBut) return res.status(404).json({ message: "Le kit valeur but n'existe pas." });
  

    

    /**
     * calcule les trois derniers factures de l'utilisateur
     */
    let consommation = kitValeurBut.consommationMin
    
    let calculConsommation = await CalculConsommationParModeGestion(compteElectriciteEauId, consommation, parseInt(modeGestionId));
    if (calculConsommation.messageError) return res.status(400).json({ messageError: calculConsommation.messageError });  
    
    
    let consommationMin = calculConsommation.data.min
    let tranche = calculConsommation.data.tranche
    let pourcentageTranche = calculConsommation.data.valeurEconomiser.toString()+"%"
    let consommationBut = calculConsommation.data.consommationNormal
    let consommationJour = calculConsommation.data.consommationJour
    let consommationHeure = calculConsommation.data.consommationHeure

   

    // send IA to user
    let analyseIA = await updateModeGestionIA(calculConsommation.data, modeGestionId);
    let messageIA = ""
    if (analyseIA.messageError) messageIA = "Modification de mode de gestion"
    else messageIA = analyseIA.msg

    // console.log("analyseIA : ",analyseIA.msg)
    
    
   

    // update kitvaleurbut
    const updateCompte = await prisma.kitValeurBut.update({
      where: {
        id: kitValeurBut.id
      },
      data: {
        status: true,
        consommationMin: consommationMin,
        tranche: tranche,
        pourcentageTranche: pourcentageTranche,
        consommationBut: consommationBut,
        consommationJour: consommationJour,
        consommationHeure: consommationHeure,
        msg1: false,
        msg2: false,
        msg3: false,
        modeGestionId: parseInt(modeGestionId)
      }
    });


    
    // const newNotif = await prisma.notification.create({
    //   data:{
    //       message: messageIA,
    //       type: "IA",
    //       utilisateurId : compteElectricite.utilisateurId
    // }})
    // // console.log("newNotif : ",newNotif)
    // req.io.emit('notifIA', newNotif);


    res.json({
      Msg: `Vous êtez en mode gestion ${modeGestionExits.mode}`,
      Data: updateCompte,
      success: true
    });

  } catch (error) {
    res.status(500).json({ messageError: error.message, success: false });
  }
};



/**
 * GET KIT VALEUR BUT BY ID KIT TONGOU
 */
export const getKitValeurByIdKitTongou = async (req, res) => {
  try {

    const idKitTongou = req.body.idKitTongou;

    if(!idKitTongou) return res.status(400).json({ message: "L'id du kit tongou est obligatoire." });

    // search Id in KitTongou
    const kitTongouExits = await prisma.kitTongou.findFirst({ 
      where: { idKitTongou: idKitTongou }
    });
    if (!kitTongouExits) return res.status(400).json({ message: "Le kit tongou n'existe pas." });

    // search id KitValeurBut By KitTongou
    const kitValeurBut = await prisma.kitValeurBut.findFirst({
      where: {
        kitTongouId: kitTongouExits.id
      }
    });
    if (!kitValeurBut) return res.status(400).json({ message: "Le kit tongou n'existe pas." });


    res.json({
      Msg: "Limites du kit",
      Data: kitValeurBut
    });

  } catch (error) {
    console.error("Erreur lors de la mise à jour :", error);
    res.status(500).json({ messageError: 'Erreur serveur' });
  }
};


/**
 * UPDATE MSG KIT VALEUR BUT FALSE
 */
export const updateKitValeurByIdKitTongou = async (req, res) => {
  try {

    const idKitTongou = req.body.idKitTongou;

    if(!idKitTongou) return res.status(400).json({ message: "L'id du kit tongou est obligatoire." });

    // search Id in KitTongou
    const kitTongouExits = await prisma.kitTongou.findFirst({ 
      where: { idKitTongou: idKitTongou }
    });
    if (!kitTongouExits) return res.status(400).json({ message: "Le kit tongou n'existe pas." });

    // search id KitValeurBut By KitTongou
    const kitValeurBut = await prisma.kitValeurBut.findFirst({
      where: {
        kitTongouId: kitTongouExits.id
      }
    });
    if (!kitValeurBut) return res.status(400).json({ message: "Le kit tongou n'existe pas." });

    // update status msg1 msg2 msg3
    const updateKitValeurBut = await prisma.kitValeurBut.update({
      where: {
        id: kitValeurBut.id
      },
      data: {
        msg1: false,
        msg2: false,
        msg3: false
      }
    });

    res.json({
      Msg: "Vous avez bien mis à jour le statut des messages",
      Data: updateKitValeurBut
    });

  } catch (error) {
    console.error("Erreur lors de la mise à jour :", error);
    res.status(500).json({ messageError: 'Erreur serveur' });
  }
};


