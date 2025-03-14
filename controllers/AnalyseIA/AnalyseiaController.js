import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv';

config();

const prisma = new PrismaClient()


export const getAllAnalyseIAByUser = async(req, res) =>{
  try {
      const utilisateurId = req.body.utilisateurId

      const response = await prisma.analyseia.findMany({
          where:{
            utilisateurId : parseInt(utilisateurId)
          },
          include: {
            Utilisateur: true
          },
      })
      res.status(201).json({
        message : "Liste de vos analyse IA",
        TotalCount: response.length,
        Data: response,
        success: true
      })
     
    } catch (error) {
      console.error( `Erreur lors du recupération de l'analyse : ${error}`)
      res.status(500).json({ 
        message: `Erreur lors du recupération de l'analyse : ${error.message}`,
        success: false
      });
    }
}




export const getAnalyseIAById = async(req, res) =>{
    try {
        const analyseiaId = req.body.analyseiaId

        const response = await prisma.analyseia.findUnique({
            where:{
                id : parseInt(analyseiaId)
            },
            include: {
              Utilisateur: true
            },
        })
        res.status(201).json({
          message : "Analyse IA",
          Data: response,
          success: true
        })
       
      } catch (error) {
        console.error( `Erreur lors du recupération de l'analyse : ${error}`)
        res.status(500).json({ 
          message: `Erreur lors du recupération de l'analyse : ${error.message}`,
          success: false
        });
      }
}




/**
 * ADD AUTO RELEVE 
 */
export const createanalyseIA= async (req, res) => {
  try {
    let { titre, analyse, utilisateurId, start_time, end_time} = req.body;
   
    let data = {
      titre: titre,
      analyse: analyse,
      utilisateurId: parseInt(utilisateurId),
      start_time: start_time,
      end_time: end_time
    }
    
    
    // add auto releve
    const analyseIA = await prisma.analyseia.create({
      data: data
    });

    // add notification
    await prisma.notification.create({
      data: {
        titre : titre,
        description: analyse,
        analyseaiId: analyseIA.id,
        type: "ia",
        isSonor: true,
        isTouched: true,
        utilisateurId: parseInt(utilisateurId)
      }
    })

    
  
    res.status(200).json({
      Msg: `Analyse bien ajouté`,
      Data: analyseIA,
      success: true
    });
    
  } catch (error) {
    console.error("Erreur lors d'ajout analyse ia : ", error);
    res.status(500).json({
      message: error.message,
      success: false
    });
  }
};



