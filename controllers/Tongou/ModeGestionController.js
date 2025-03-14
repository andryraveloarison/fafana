import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv';
import axios from 'axios'


const prisma = new PrismaClient()

/**
 *
 *  GET ALL MODE GESTION
 *
 */
export const getAllModeGestion = async (req, res) => {
  try {
    const data = await prisma.modeGestion.findMany();
    res.status(200).json({
        message: "Données des mode de gestion",
        data: data,
        length: data.length
    });
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la récupération des données",
      error: error.message
    });
  }
};


/**
 *
 *  GET MODE GESTION BY ID
 *
 */
export const getModeGestionById = async (req, res) => {
  try {
    const idModeGestion = req.body.idModeGestion;
    const data = await prisma.modeGestion.findFirst({
      where: {
        id: parseInt(idModeGestion)
      }
    });

    
    res.status(200).json({
        message: "Données du mode de gestion",
        data: data
    });

  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la récupération des données",
    });
  }
};



/**
 *
 *  CREATE MODE GESTION
 *
 */
export const createModeGestion = async (req, res) => {
  try {
    const { mode, pourcent } = req.body;
    if(!mode || !pourcent) res.status(400).json({message: "Le mode de gestion et le pourcentage sont obligatoires"});

    const modeGestion = await prisma.modeGestion.create({
      data: {
        mode: mode.toLowerCase(),
        pourcent: parseFloat(pourcent)
      },
    });
    res.status(201).json({
      message: "Mode de gestion créé",
      data: modeGestion
    });
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la création du mode de gestion",
      error: error.message
    });
  }
};


/**
 *
 *  CREATE MODE GESTION
 *
 */
export const updateModeGestionNull = async (req, res) => {
  try {
  
    // get kitValeurNull in KitValeurBut
    const kitValeurNull = await prisma.kitValeurBut.findMany({
      where: {
        modeGestionId: null
      }
    });

    for (let index = 0; index < kitValeurNull.length; index++) {
      let id = kitValeurNull[index].id
      
      let a = await prisma.kitValeurBut.update({
        where: {
          id: id
        },
        data: {
          modeGestionId: 2
        }
      });
      
      
    }

    const kitValeurUpdate = await prisma.kitValeurBut.findMany()

    res.status(201).json({
      message: "",
      data: kitValeurUpdate
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};