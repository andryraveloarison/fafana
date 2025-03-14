import fs from "fs"
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import jwt from "jsonwebtoken";
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()



/**
 * LIER USER BY OTHER COMPTE
 */
export const linkUserToAccounts = async (req, res) => {
  try {
    const { utilisateurId, referenceClient } = req.body; 
    if(!utilisateurId) return res.status(404).json({ message: "Veuillez ajouter l'ID d'utilisateur", success: false });
    if(!referenceClient) return res.status(404).json({ message: "Veuillez ajouter la réference du compte", success: false });

    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id: utilisateurId },
    });
    if (!utilisateur)  return res.status(404).json({ message: 'Utilisateur non trouvé', success: false });
    

    const compte = await prisma.compteElectriciteEau.findFirst({
      where: { referenceClient: referenceClient },
      include: {
        Utilisateur: true
      },
    });
    if (!compte)  return res.status(404).json({ message: 'Compte non trouvé', success: false });

    let compteElectriciteEauId = compte.id
    

    const ifCompteUser = await prisma.compteElectriciteEau.findFirst({
      where: {
        AND: [
          { id: compteElectriciteEauId },
          { utilisateurId: utilisateurId }
        ]
      }
    });
    if (ifCompteUser)  return res.status(404).json({ message: "Ce compte est à vous!", success: false });


    // find if user already have a compte
    const ifUserHaveCompte = await prisma.userManyCompteElectriciteEau.findFirst({
      where: {
        AND: [
          { utilisateurId: utilisateurId },
          { compteElectriciteEauId: compteElectriciteEauId }
        ]
      }
    });
    if (ifUserHaveCompte)  return res.status(404).json({ message: "Vous avez déjà connecté à ce compte!", success: false });


    const updatedUtilisateur = await prisma.userManyCompteElectriciteEau.create({
      data: {
        utilisateurId: parseInt(utilisateurId),
        compteElectriciteEauId: parseInt(compteElectriciteEauId), 
        valid: false,
      },
    });

    // send notification
    let userPropriete = compte.utilisateurId
    let message = `${utilisateur.nom} veut accéder à votre compteur ${compte.pseudoCompte} REF : ${compte.referenceClient}`
    
    req.io.emit('notifAccesCompte', {
      message: message,
      type: "simple",
      utilisateurId : userPropriete
    });

    // await prisma.notification.create({
    //   data:{
    //     message: message,
    //     type: "simple",
    //     utilisateurId : userPropriete
    // }}) 

    res.status(200).json({
      message: 'Utilisateur relié aux comptes avec succès',
      utilisateur: updatedUtilisateur,
    });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};



/**
 * GET ALL COMPTEUR USER NEED VALIDATION
 */
export const getAllUserNeedValidationToConnectedByCompteUser = async (req, res) => {
  try {
    const { utilisateurId } = req.body; 

    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id: utilisateurId },
    });
    if (!utilisateur)return res.status(404).json({ message: 'Utilisateur non trouvé', success: false });

    // find all compteur by user
    const compteurUser = await prisma.compteElectriciteEau.findMany({
      where: { utilisateurId: utilisateurId },
    });


    // find user connect by compte
    let data = {}

    for (let index = 0; index < compteurUser.length; index++) {
      let compteElectriciteEauId = compteurUser[index].id
      
      let userAllCompte = await prisma.userManyCompteElectriciteEau.findMany({
        where: {
          AND: [
            { compteElectriciteEauId: compteElectriciteEauId },
            { valid: false }
          ]
        },
        include: {
          Utilisateur: true,
          CompteElectriciteEau: true
        },
      });

      data[`compte_${index}`] = userAllCompte;
    }

    res.status(200).json({
      message: 'Liste des utilisateurs qui à besoin de validation',
      Data : data,
      success : true
    });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};




/**
 * GET ALL COMPTEUR USER NEED VALIDATION
 */
export const validDemandeUserCompte = async (req, res) => {
  try {
    const { utilisateurId, compteElectriciteEauId } = req.body; 
    if(!utilisateurId || !compteElectriciteEauId) return res.status(400).json({ message: 'Utilisateur ou compte non trouvé', success: false });

    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id: utilisateurId },
    });
    if (!utilisateur)return res.status(404).json({ message: 'Utilisateur non trouvé', success: false });

    const compte = await prisma.compteElectriciteEau.findUnique({
      where: { id: compteElectriciteEauId },
      include: {
        Utilisateur: true
      },
    });
    if (!compte) return res.status(404).json({ message: 'Compte non trouvé', success: false });

    // valide la demande
    const compteValid = await prisma.userManyCompteElectriciteEau.update({
      where: {
        utilisateurId_compteElectriciteEauId: {
          utilisateurId: parseInt(utilisateurId),
          compteElectriciteEauId: parseInt(compteElectriciteEauId),
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
      message: `Validation acceptée pour l'utilisateur ${utilisateur.nom}`,
      Data : compteValid,
      success : true
    });

  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};



/**
 * DELETE USER USE MY COMPTE
 */
export const deleteUserUseMyCompte = async (req, res) => {
  try {
    const { utilisateurId, compteElectriciteEauId } = req.body; 
    if(!utilisateurId || !compteElectriciteEauId) return res.status(400).json({ message: 'Utilisateur ou compte non trouvé', success: false });

    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id: utilisateurId },
    });
    if (!utilisateur)return res.status(404).json({ message: 'Utilisateur non trouvé', success: false });

    const compte = await prisma.compteElectriciteEau.findUnique({
      where: { id: compteElectriciteEauId },
      include: {
        Utilisateur: true
      },
    });
    if (!compte) return res.status(404).json({ message: 'Compte non trouvé', success: false });

    // find if user already have a compte
    const ifUserHaveCompte = await prisma.userManyCompteElectriciteEau.findFirst({
      where: {
        AND: [
          { utilisateurId: utilisateurId },
          { compteElectriciteEauId: compteElectriciteEauId }
        ]
      }
    });
    if(!ifUserHaveCompte) return res.status(400).json({ message: "Ce compte n'existe pas", success: false });
    
    // delete
    const compteDelete = await prisma.userManyCompteElectriciteEau.delete({
      where: {
        utilisateurId_compteElectriciteEauId: {
          utilisateurId: parseInt(utilisateurId),
          compteElectriciteEauId: parseInt(compteElectriciteEauId),
        },
      },
    });

    res.status(200).json({
      message: `Vous avez supprimé l'accès de ${utilisateur.nom} à votre compte`,
      Data : compteDelete,
      success : true
    });

  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};


