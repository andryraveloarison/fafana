import fs from "fs"
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import jwt from "jsonwebtoken";
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()



/**
 * LIER USER BY OTHER KITTONGOU
 */
export const linkUserToOtherKitTongou = async (req, res) => {
  try {
    const { utilisateurId, kitTongouId } = req.body; 
    if(!utilisateurId) return res.status(404).json({ message: "Veuillez ajouter l'ID d'utilisateur", success: false });
    if(!kitTongouId) return res.status(404).json({ message: "Veuillez ajouter l'ID du kit", success: false });

    // trouver l'utilisateur
    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id: parseInt(utilisateurId) },
    });
    if (!utilisateur)  return res.status(404).json({ message: 'Utilisateur non trouvé', success: false });

    
    // trouver le kit
    const kitTongou = await prisma.kitTongou.findFirst({
      where: { idKitTongou: kitTongouId },
    })
    if (!kitTongou)  return res.status(404).json({ message: 'Kit non trouvé', success: false });
    if(kitTongou.status === false) return res.status(404).json({ message: "Ce kit n'est pas encore activé", success: false });
    if(kitTongou.blocked === true) return res.status(404).json({ message: "Ce kit est bloqué, vous ne pouvez pas l'utiliser", success: false });



    // trouver l'utilisateur qui utilise le kit (KitTongoUser) 
    const kitTongouUser = await prisma.kitTongouUser.findFirst({
      where: {
        kitTongouId: kitTongou.id
      }
    });
    if (!kitTongouUser)  return res.status(404).json({ message: "Ce kit n'est pas encore utilisé par un utilisateur", success: false });
    let compteElectriciteEauId = kitTongouUser.compteElectriciteEauId
    


    // trouver si c'est un kit de l'utilisateur
    const ifKitTongouUser = await prisma.kitTongouUser.findFirst({
      where: {
        AND: [
          { kitTongouId: kitTongou.id },
          { utilisateurId: parseInt(utilisateurId) }
        ]
      }
    });
    if (ifKitTongouUser)  return res.status(404).json({ message: "Ce kit est à vous!", success: false });


    // trouver si l'utilisateur utilise déjà ce kit
    const ifUserHaveCompte = await prisma.kitTongouManyUser.findFirst({
      where: {
        AND: [
          { kitTongouId: kitTongou.id },
          { utilisateurId: parseInt(utilisateurId) },
          { compteElectriciteEauId: compteElectriciteEauId }
        ]
      }
    });
    if (ifUserHaveCompte)  return res.status(404).json({ message: "Vous avez déjà connecté à ce kit!", success: false });


    const createKitTongouManyUser = await prisma.kitTongouManyUser.create({
      data: {
        kitTongouId: kitTongou.id,
        utilisateurId: parseInt(utilisateurId),
        compteElectriciteEauId: parseInt(compteElectriciteEauId), 
        valid: false,
      },
    });

    // send notification
    let userProprieteId = kitTongouUser.utilisateurId
    let message = `${utilisateur.nom || utilisateur.email} veut accéder à votre kit ${kitTongou.pseudo} ID : ${kitTongou.idKitTongou}`
    
    req.io.emit('notifAccesKitTongou', {
      message: message,
      type: "simple",
      utilisateurId : userProprieteId
    });

    // await prisma.notification.create({
    //   data:{
    //     message: message,
    //     type: "simple",
    //     utilisateurId : userProprieteId
    // }}) 

    res.status(200).json({
      message: `L'utilisateur ${utilisateur.nom || utilisateur.email} a bien été relié au kit ${kitTongou.pseudo} ID : ${kitTongou.idKitTongou}`,
      Data: createKitTongouManyUser,
      success: true
    });
  } catch (error) {
    console.error("Erreur lors de la lisaion du kit par un utilisateur :", error);
    res.status(500).json({ message: error.message, success: false });
  }
};







/**
 * GET ALL COMPTEUR USER NEED VALIDATION TO CONNECT KIT TONGOU
 */
export const getAllUserNeedValidationToConnectedByKitTongou = async (req, res) => {
  try {
    const { utilisateurId } = req.body; 
    if(!utilisateurId) return res.status(404).json({ message: "Veuillez ajouter d'ID de l'utilisateur", success: false });

    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id: parseInt(utilisateurId) },
    });
    if (!utilisateur)return res.status(404).json({ message: 'Utilisateur non trouvé', success: false });


    // trouver tout les kits de l'utilisateur
    const kitTongouUser = await prisma.kitTongouUser.findMany({
      where: {
        utilisateurId: parseInt(utilisateurId)
      },
    });

    let reponse = {}

    for (let index = 0; index < kitTongouUser.length; index++) {
      let kitTongouId = kitTongouUser[index].kitTongouId
      let compteElectriciteEauId = kitTongouUser[index].compteElectriciteEauId

      // find kitTongou
      const kitTongou = await prisma.kitTongou.findUnique({
        where: {
          id: kitTongouId
        },
      });

      // find all user not validated
      let userAllCompte = await prisma.kitTongouManyUser.findMany({
        where: {
          AND: [
            { kitTongouId : kitTongouId},
            { compteElectriciteEauId: compteElectriciteEauId },
            { valid: false }
          ]
        },
        include: {
          Utilisateur: true,
          CompteElectriciteEau: true,
          KitTongou: true
        },
      });

      if(userAllCompte.length > 0){
        reponse[index] = {
          kitTongou: kitTongou,
          Data: userAllCompte
        }; 
      }
    }

    
    // trouver les user non validé par le kit
    


    res.status(200).json({
      message: `Liste des utilisateurs qui à besoin de validation sur votre kit`,
      Data : reponse,
      success : true
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs à valider :", error);
    res.status(500).json({ message: error.message, success: false });
  }
};






/**
 * GET ALL USER USED MY KIT
 */
export const getAllUserUsedMyKitTongou = async (req, res) => {
  try {
    const { utilisateurId } = req.body; 
    if(!utilisateurId) return res.status(404).json({ message: "Veuillez ajouter d'ID de l'utilisateur", success: false });

    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id: parseInt(utilisateurId) },
    });
    if (!utilisateur)return res.status(404).json({ message: 'Utilisateur non trouvé', success: false });


    // trouver tout les kits de l'utilisateur
    const kitTongouUser = await prisma.kitTongouUser.findMany({
      where: {
        utilisateurId: parseInt(utilisateurId)
      },
    });

    let reponse = {}

    for (let index = 0; index < kitTongouUser.length; index++) {
      let kitTongouId = kitTongouUser[index].kitTongouId
      let compteElectriciteEauId = kitTongouUser[index].compteElectriciteEauId

      // find kitTongou
      const kitTongou = await prisma.kitTongou.findUnique({
        where: {
          id: kitTongouId
        },
      });

      // find all user not validated
      let userAllCompte = await prisma.kitTongouManyUser.findMany({
        where: {
          AND: [
            { kitTongouId : kitTongouId},
            { compteElectriciteEauId: compteElectriciteEauId },
            { valid: true }
          ]
        },
        include: {
          Utilisateur: true,
          CompteElectriciteEau: true,
          KitTongou: true
        },
      });

      if(userAllCompte.length > 0){
        reponse[index] = {
          kitTongou: kitTongou,
          Data: userAllCompte
        }; 
      }
    }

    
    // trouver les user non validé par le kit
    


    res.status(200).json({
      message: `Liste des utilisateurs qui utilise mes kits`,
      Data : reponse,
      success : true
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs à valider :", error);
    res.status(500).json({ message: error.message, success: false });
  }
};






/**
 * VALIDER L'UTILISATEUR A LA DEMANDE 
 */
export const validDemandeUserKit = async (req, res) => {
  try {
    const { utilisateurId, compteElectriciteEauId, kitTongouId } = req.body; 
    if(!utilisateurId || !compteElectriciteEauId || !kitTongouId) return res.status(400).json({ message: 'Veuillez renseigner tous les champs', success: false });

    // trouver l'utilisateur
    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id: parseInt(utilisateurId) },
    });
    if (!utilisateur)return res.status(404).json({ message: 'Utilisateur non trouvé', success: false });
    
    // trouver le compte
    const compte = await prisma.compteElectriciteEau.findUnique({
      where: { id: parseInt(compteElectriciteEauId) },
      include: {
        Utilisateur: true
      },
    });
    if (!compte) return res.status(404).json({ message: 'Compte non trouvé', success: false });


    // trouver le kit
    const kit = await prisma.kitTongou.findFirst({
      where: { id: parseInt(kitTongouId) },
    });
    if (!kit) return res.status(404).json({ message: 'Kit non trouvé', success: false });



    // trouver si cette demande existe
    let demandeListe = await prisma.kitTongouManyUser.findFirst({
      where: {
        AND: [
          { utilisateurId: parseInt(utilisateurId)},
          { compteElectriciteEauId: parseInt(compteElectriciteEauId) },
          { kitTongouId: parseInt(kitTongouId) }
        ]
      },
    });
    if(!demandeListe) return res.status(404).json({ message: "Cette demande n'existe pas", success: false });



    
    // valide la demande
    const compteValid = await prisma.kitTongouManyUser.update({
      where: {
        utilisateurId_compteElectriciteEauId_kitTongouId: {
          utilisateurId: parseInt(utilisateurId),
          compteElectriciteEauId: parseInt(compteElectriciteEauId),
          kitTongouId: parseInt(kitTongouId)
        },
      },
      data: {
        valid: true,
      },
      include: {
        Utilisateur: true,
        CompteElectriciteEau: true
      }
    });
    

    res.status(200).json({
      message: `Validation acceptée pour l'utilisateur ${utilisateur.nom} sur le kit ${kit.pseudo} (${kit.idKitTongou})`,
      Data : compteValid,
      success : true
    });

  } catch (error) {
    console.error("Erreur lors de la validation de l'utilisateur", error);
    res.status(500).json({ message: error.message, success: false });
  }
};



/**
 * DELETE USER USE MY KIT
 */
export const deleteUserUseMyKit = async (req, res) => {
  try {
    const { utilisateurId, compteElectriciteEauId, kitTongouId } = req.body; 
    if(!utilisateurId || !compteElectriciteEauId || !kitTongouId) return res.status(400).json({ message: 'Veuillez renseigner tous les champs', success: false });

    // trouver l'utilisateur
    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id: parseInt(utilisateurId) },
    });
    if (!utilisateur)return res.status(404).json({ message: 'Utilisateur non trouvé', success: false });
    
    // trouver le compte
    const compte = await prisma.compteElectriciteEau.findUnique({
      where: { id: parseInt(compteElectriciteEauId) },
      include: {
        Utilisateur: true
      },
    });
    if (!compte) return res.status(404).json({ message: 'Compte non trouvé', success: false });


    // trouver le kit
    const kit = await prisma.kitTongou.findFirst({
      where: { id: parseInt(kitTongouId) },
    });
    if (!kit) return res.status(404).json({ message: 'Kit non trouvé', success: false });


    // trouver si cette demande existe
    let demandeListe = await prisma.kitTongouManyUser.findFirst({
      where: {
        AND: [
          { utilisateurId: parseInt(utilisateurId)},
          { compteElectriciteEauId: parseInt(compteElectriciteEauId) },
          { kitTongouId: parseInt(kitTongouId) }
        ]
      },
    });
    if(!demandeListe) return res.status(404).json({ message: "Cette liaison n'existe pas", success: false });

    
    // delete
    const compteDelete = await prisma.kitTongouManyUser.delete({
      where: {
        utilisateurId_compteElectriciteEauId_kitTongouId: {
          utilisateurId: parseInt(utilisateurId),
          compteElectriciteEauId: parseInt(compteElectriciteEauId),
          kitTongouId: parseInt(kitTongouId)
        },
      },
    });

    res.status(200).json({
      message: `Vous avez supprimé l'accès de ${utilisateur.nom || utilisateur.email} à votre kit ${kit.pseudo} (${kit.id})`,
      Data : compteDelete,
      success : true
    });

  } catch (error) {
    console.error("Erreur lors de la suppression du compte :", error);
    res.status(500).json({ message: error.message, success: false });
  }
};


