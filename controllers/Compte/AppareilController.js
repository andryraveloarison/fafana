import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv';
import axios from 'axios'

const prisma = new PrismaClient()


config();

/***
 * 
 * send notification Simulation
 */
export const getallAppareil = async (req, res) => {
    try {

        let appareils = await prisma.materiel.findMany()

  
  
      return res.status(201).json({
        appareils: appareils,
        success: true
      });
  
    } catch (error) {
      console.error("Erreur lors de la recuperation des appareils", error);
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
export const addAppareil = async (req, res) => {
    try {

        console.log(req.body.nom)
        let appareil = await prisma.materiel.create({
          data: {
            nom: req.body.nom
          }
        })
  
      return res.status(201).json({
        appareil: req.body.nom,
        success: true
      });
  
    } catch (error) {
      console.error("Erreur lors de l'insertion de l'appareil", error);
      res.status(500).json({
        message: "Erreur lors de la recuperation",
        error: error.message,
        success: false
      });
    }
  };