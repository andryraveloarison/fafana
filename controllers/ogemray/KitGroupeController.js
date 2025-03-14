import jwt from "jsonwebtoken";
import { PrismaClient } from '@prisma/client'
import axios from 'axios'

const prisma = new PrismaClient()
const portAppareil = process.env.PORT_APPAREIL

export const getAllKitGroupe = async(req, res) =>{
  try {
      const response = await prisma.kitGroupe.findMany({
        orderBy: {
            id:'desc',
        },
        include: {
            Utilisateur: true
        },
      })
      res.status(200).json({
        Msg: "Listes des groupes du kits",
        TotalCount: response.length,
        Data: response
      })
     
    } catch (error) {
      res.status(500).json({ messageError: 'Erreur serveur' });
    }
}


export const getKitGroupeByUser = async(req, res) =>{
    try {
        const token = req.body.token;
        
        if (!token) return res.status(404).json({ messageError: 'Token manquant, veuillez reconnecter' });

        const decodedToken = jwt.decode(token);
        if (!decodedToken || !decodedToken.user) return res.status(403).json({ messageError: 'Token invalide' });

        const utilisateurId = decodedToken.user

        const response = await prisma.kitGroupe.findMany({
            where:{
                OR: [
                    { utilisateurId: parseInt(utilisateurId) },
                    { status : "default" }
                ]
            }
        })

        res.status(200).json({
            Msg: "Listes des groupes de vos kits",
            TotalCount: response.length,
            Data: response
          })
       
      } catch (error) {
        res.status(500).json({ messageError: 'Erreur serveur' });
      }
}



export const createKitGroupe = async(req, res) =>{
    try {
        const kitgroupe = req.body.kitgroupe;
        const token = req.body.token;
        let utilisateurId = ""
        let status = "default"
        if (token) {
            const decodedToken = jwt.decode(token);  
            if (!decodedToken || !decodedToken.user)  return res.status(403).json({ messageError: 'Token invalide' });
    
            utilisateurId= decodedToken.user;  
            status = "customer"  

            const kitExist = await prisma.userAppareil.findMany({
                where: {
                    utilisateurId : parseInt(utilisateurId)
                }
            });
            if(kitExist.length === 0) return res.status(403).json({ messageError: 'Vous devez avoir au moins un appareil avant de créer un groupe!' })
     
        }
            
        const typeExit1 = await prisma.kitGroupe.findFirst({
            where: {
                AND: [
                    { kitgroupe : kitgroupe.toLowerCase() },
                    { status: "default" }
                ]
            }
        });
        if (typeExit1) return res.status(403).json({ messageError: 'Ce groupe est déjà dans les listes par défaut!' });

        const typeExit2 = await prisma.kitGroupe.findFirst({
            where: {
                AND: [
                    { kitgroupe : kitgroupe.toLowerCase() },
                    { utilisateurId: parseInt(utilisateurId) }
                ]
            }
        });
        if (typeExit2) return res.status(403).json({ messageError: 'Ce groupe existe déjà!' });


        const newGroupe = await prisma.kitGroupe.create({
            data: {
                kitgroupe : kitgroupe.toLowerCase(), 
                utilisateurId : parseInt(utilisateurId),
                status : status
            }
        });

        res.status(201).json({ 
            Msg: "Votre groupe est bien crée avec succès",
            Data: newGroupe
         });
       
      } catch (error) {
        res.status(500).json({ messageError: 'Erreur serveur' });
      }
}





/**
 * 
 * RECENT
 */
export const deleteTypeAppareil = async(req, res) =>{
    try {

        const typeId = req.body.typeId

        const typeAppareil = await prisma.typeAppareil.findUnique({
            where:{
                id: parseInt(typeId)
            }
        })
        if(!typeAppareil) return res.json({messageError: "Introuvable!"})

        await prisma.typeAppareil.delete({
            where: {
                id: parseInt(typeId),
            }       
        });

        res.json({messageSucces:"Suppression a été effectué avec succès"})
        
       
      } catch (error) {
        res.status(500).json({ messageError: 'Erreur serveur' });
      }
}

export const deleteAllTypeAppareil = async (req, res) => {
    try {
      // Supprimer toutes les entrées de la table
      await prisma.typeAppareil.deleteMany({});
  
      // Réinitialiser l'auto-incrémentation de l'ID
      await prisma.$executeRaw`ALTER SEQUENCE "TypeAppareil_id_seq" RESTART WITH 1;`;
  
      res.json({ messageSucces: "Toutes les données ont été supprimées et l'ID a été réinitialisé" });
    } catch (error) {
      res.status(500).json({ messageError: 'Erreur serveur' });
    }
  };
  