import jwt from "jsonwebtoken";
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const getAllNotification = async(req, res) =>{
    try {

        const getAllNotif = await prisma.notification.findMany({
          orderBy: {
            id:'desc',
          },
        });

        res.status(200).json({
          message: `Listes de toutes les notifications`,
          count: getAllNotif.length,
          Data: getAllNotif,
          success: true,
        })
     
       
      } catch (error) {
        res.status(500).json({ messageError: 'Erreur serveur' });
      }
}


export const getNotificationUserFiltre = async(req, res) =>{
    try {
        const { utilisateurId, type} = req.body

        if (!utilisateurId) return res.status(404).json({ message: 'Veuillez ajouter ID utilisateur', success: false});
        if (!type) return res.status(404).json({ messageError: 'Veuillez ajouter le type', success: false });

        const getMyNotice = await prisma.notification.findMany({
            where: {
                AND: [
                    { utilisateurId: parseInt(utilisateurId) },
                    { type: type }
                ]
            }, orderBy: {
            id:'desc',
          },
          orderBy: {
            id:'desc',
          },
          });

        
        res.status(200).json({
            message: `Listes des notifications ${type}`,
            TotalCount: getMyNotice.length,
            Data: getMyNotice,
            success: true
        })
       
      } catch (error) {
        console.error(`Erreur lors du recupératon de vos notification ${type} :  ${error}`)
        res.status(500).json({ 
          message: `Erreur lors du recupération de vos notification ${type}`,
          success: false
         });
      }
}


export const getNotificationUser = async(req, res) =>{
    try {
        const { utilisateurId} = req.body


        const notification = await prisma.notification.findMany({
            where: {  
              utilisateurId: parseInt(utilisateurId) 
            }
          });

        
        res.status(201).json({
          message: "Vos notifications",
          TotalCount: notification.length,
          Data: notification,
          success: true
        })
       
      } catch (error) {
        console.error(`Erreur lors du recupération de vos notifications : ${error}`)
        res.status(500).json({ 
          message: `Erreur lors du recupération de vos notifications`,
          success: false
        });
      }
}



export const deleteAllNotification = async (req, res) => {
    try {
      // DELETE NOTIFICATION
      await prisma.notification.deleteMany({});
      await prisma.$executeRaw`ALTER SEQUENCE "Notification_id_seq" RESTART WITH 1;`;
  
  
      res.status(200).json({
        messageSucces: "Toutes les notifications ont été supprimées",
        data : []
       });
    } catch (error) {
      res.status(500).json({ messageError: 'Erreur serveur' });
    }
  };