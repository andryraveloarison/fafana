import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv';
import axios from 'axios'

const prisma = new PrismaClient()


config();

/***
 * 
 * GET ALL TYPE HOME
 */
export const getallTypeHome = async (req, res) => {
    try {

        let typeHomes = await prisma.typeHome.findMany()

  
  
      return res.status(201).json({
        typeHomes: typeHomes,
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



  
/***
 * 
 * send notification Simulation
 */
export const addTypeHome = async (req, res) => {
    try {

        console.log(req.body.nom)
        let typeHome = await prisma.typeHome.create({
          data: {
            nom: req.body.nom
          }
        })
  
      return res.status(201).json({
        appareil: req.body.nom,
        success: true
      });
  
    } catch (error) {
      console.error("Erreur lors de l'insertion du type home", error);
      res.status(500).json({
        message: "Erreur lors de la recuperation",
        error: error.message,
        success: false
      });
    }
  };