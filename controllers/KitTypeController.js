import jwt from "jsonwebtoken";
import { PrismaClient } from '@prisma/client'
import axios from 'axios'

const prisma = new PrismaClient()

export const getAllKitType = async(req, res) =>{
  try {
      const response = await prisma.kitType.findMany({
        orderBy: {
            id:'asc',
        }
      })
      res.status(200).json({
        Msg: "Listes des types de kits",
        TotalCount: response.length,
        Data: response,
        success: true
      })
     
    } catch (error) {
      res.status(500).json({ messageError: 'Erreur serveur' });
    }
}


export const getKitTypeById = async(req, res) =>{
    try {
        const kitTypeId = req.body.kitTypeId;
        

        const response = await prisma.kitType.findUnique({
            where:{
                id: parseInt(kitTypeId)
            }
        })

        res.status(200).json({
            Msg: "",
            Data: response,
            success: true
          })
       
      } catch (error) {
        res.status(500).json({ messageError: 'Erreur serveur' });
      }
}



export const createKitType = async(req, res) =>{
    try {
        const type = req.body.type;
            
        const kitTypeExit = await prisma.kitType.findFirst({
            where: {
                type: type.toLowerCase()
            }
        });
        if (kitTypeExit) return res.status(403).json({ messageError: 'Ce type de kit existe déjà', success: false });


        const newKitType = await prisma.kitType.create({
            data: {
                type: type.toLowerCase()
            }
        });

        res.status(201).json({ 
            Msg: "Votre type de kit est bien crée avec succès",
            Data: newKitType,
            success: true
         });
       
      } catch (error) {
        res.status(500).json({ messageError: 'Erreur serveur' });
      }
}



