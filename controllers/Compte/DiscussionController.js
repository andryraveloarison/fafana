import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv';
import axios from 'axios'

const prisma = new PrismaClient()

const port_ia = process.env.PORT_IA;

config();
/**
 * 
 * get messages
 */
export const getMessages = async (req, res) => {
    try {
        const { utilisateurId } = req.body; // On suppose que vous passerez l'ID de l'utilisateur dans l'URL

        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: Number(utilisateurId) },
                    { receiverId: Number(utilisateurId) }
                ]
            },
            orderBy: {
                createdAt: 'asc' // Optionnel : trier les messages par date croissante
            }
        });

        return res.status(200).json({
            data: messages,
            success: true
        });

    } catch (error) {
        console.error("Erreur lors de la récupération des messages", error);
        res.status(500).json({
            message: "Erreur lors de la récupération des messages",
            error: error.message,
            success: false
        });
    }
};

  
/***
 * 
 * send message
 */
export const addMessage = async (req, res) => {
    try {
        
        let { senderId, receiverId, message} = req.body;



        console.log(req.body.message)
        let messages = await prisma.message.create({
          data: {
            senderId:senderId,
            receiverId: receiverId,
            message:message
          }
        })

        if(receiverId == 0){
            //ALEFA ANY AMIN'NY CHAT
            try {
            axios.post(`${port_ia}/chat`, {utilisateurId: senderId, message: message} );
          } catch (error) {
            console.error("Erreur lors de l'insertion du message", error.message);
            res.status(500).json({
              message: "Erreur lors de la recuperation",
              error: error.message,
              success: false
            });
          }
        }
        
        
        req.io.emit('message', {
          senderId:senderId,
          receiverId: receiverId,
          message:message
        });
  
  
      return res.status(201).json({
        data: messages,
        success: true
      });
  
    } catch (error) {
      //console.error("Erreur lors de l'insertion du message", error.message);
      res.status(500).json({
        message: "Erreur lors de la recuperation",
        error: error.message,
        success: false
      });
    }
  };