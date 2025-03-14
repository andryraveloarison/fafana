import jwt from "jsonwebtoken";
import path, { dirname } from 'path';
import { PrismaClient } from '@prisma/client'
import fs from "fs"
import axios from 'axios'
import { config } from 'dotenv';

config();

const prisma = new PrismaClient()
const port_ecozipo = process.env.PORT_ECOZIPO;


/**
 * GET ALL BLOG PERSO USER
 */
export const getAllBlogPersoUser = async(req, res) =>{
  try {
    const utilisateurId = req.body.utilisateurId
    if(!utilisateurId) return res.status(400).json({message: "Veuillez ajouter l'utilisateur id", success: false})

    // find if utilisateur exist
    const utilisateur = await prisma.utilisateur.findUnique({
      where: {
        id: parseInt(utilisateurId)
      }
    })
    if(!utilisateur) return res.status(400).json({message: "Utilisateur introuvable", success: false})
    
      
    const response = await prisma.blogPersoUser.findMany({
        where: { utilisateurId : parseInt(utilisateurId) },
        orderBy: {
            id:'desc',
        }
    })
    res.status(200).json({
        message: "Blogs de l'utilisateur",
        data: response,
        success: true
    })
     
    } catch (error) {
      res.status(500).json({ message: error.message, success: false });
    }
}



/**
 * CREATE BLOG PERSO USER
 */
export const createBlogPersoUser = async (req, res) => {
    try {
        let { titre, description, utilisateurId } = req.body
        if(!titre || !description || !utilisateurId) return res.status(400).json({ message: "Les champs 'titre', 'description' et 'utilisateurId' sont obligatoires", success: false });

        // find if utilisateur exist
        const utilisateur = await prisma.utilisateur.findUnique({
            where: {
            id: parseInt(utilisateurId)
            }
        })
        if(!utilisateur) return res.status(400).json({message: "Utilisateur introuvable", success: false})

    
        const newBlogPerso = await prisma.blogPersoUser.create({
            data: {
                titre,
                description,
                utilisateurId: parseInt(utilisateurId)
            }
        });

        
        // Émettre une notification via Socket.IO
        req.io.emit('newblogperso', newBlogPerso);

        res.status(201).json({
            message: "Blog créé avec succès",
            success: true,
            data: newBlogPerso
        });
        
    } catch (error) {
        res.status(500).json({ message: error.message, success: false });
    }
};

/**
 * DELETE BLOG PERSO USER
 */
export const deleteBlogPersoUserById = async (req, res) => {
    try {
        let blogPersoUserId = req.body.blogPersoUserId
        if(!blogPersoUserId) return res.status(400).json({message: "Blog perso user id introuvable", success: false})
        
        // find if blogPersoUser exist
        const blogPersoUser = await prisma.blogPersoUser.findUnique({
            where: {
                id: parseInt(blogPersoUserId)
            }
        })
        if(!blogPersoUser) return res.status(400).json({message: "Blog perso user introuvable", success: false})

        await prisma.blogPersoUser.delete({
            where: {
                id: parseInt(blogPersoUserId)
            }
        })

        res.status(200).json({
            message: "Blog perso user supprimé avec succès",
            success: true,
            data: []
        });
        
    } catch (error) {
        res.status(500).json({ message: error.message, success });
    }
};



/**
 * DELETE ALL BLOG PERSO USER
 */
export const deleteAllBlogPersoUser = async (req, res) => {
    try {
        let utilisateurId = req.body.utilisateurId
        if(!utilisateurId) return res.status(400).json({ message: "L champs 'utilisateurId' est obligatoire", success: false });

         // find if utilisateur exist
        const utilisateur = await prisma.utilisateur.findUnique({
            where: {
            id: parseInt(utilisateurId)
            }
        })
        if(!utilisateur) return res.status(400).json({message: "Utilisateur introuvable", success: false})

        // delete all blogPersoUser
        await prisma.blogPersoUser.deleteMany({
            where: {
                utilisateurId: parseInt(utilisateurId)
            }
        })

        res.status(200).json({
            message: "Tous les blog perso user supprimés avec succès",
            success: true,
            data: []
        })
    } catch (error) {
        res.status(500).json({ message: error.message, success });
    }
};
