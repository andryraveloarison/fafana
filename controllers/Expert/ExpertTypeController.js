import { PrismaClient } from '@prisma/client'
// import jwt from "jsonwebtoken";

const prisma = new PrismaClient()


export const getAllExpertType = async(req, res) =>{
  try {

      const response = await prisma.typeExpert.findMany()
      res.status(200).json({
        message: "Listes des types d'expert",
        TotalCount: response.length,
        Data: response,
        success: true,
      });
     
    } catch (error) {
      res.status(500).json({ message: error.message, success: false });
    }
}

export const createExpertType = async(req, res) =>{
    try {
        const type = req.body.type;
        const nomLowercase = type.toLowerCase();
        if(!type) return res.status(400).json({ message: "Le champ type est obligatoire", success: false });
        
        const typeExit = await prisma.typeExpert.findUnique({
          where:{
            type: nomLowercase
          }
        })

        if(typeExit) return res.status(400).json({ message: "Cette type d'Expert existe déjà", success: false });

        const newTypeExpert = await prisma.typeExpert.create({
          data: {
            type: nomLowercase
          }
        });
        res.status(201).json({
          message: "Ajout d'un nouveau type d'expert",
          success: true,
          Data: newTypeExpert,
        });
       
      } catch (error) {
        res.status(500).json({ message: error.message, success: false });
      }
}