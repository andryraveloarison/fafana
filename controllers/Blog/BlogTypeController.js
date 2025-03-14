import jwt from "jsonwebtoken";
import fs from "fs"
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()


export const getAllBlogType = async(req, res) =>{
  try {
      const response = await prisma.typeBlog.findMany({
        orderBy: {
          id:'asc',
        },
      })
      res.json(response)
     
    } catch (error) {
      res.status(500).json({ messageError: 'Erreur serveur' });
    }
}


export const getBlogTypeById = async(req, res) =>{
    try {
        const idBlogType = req.body.idBlogType

        const response = await prisma.typeBlog.findUnique({
            where:{
                id : parseInt(idBlogType)
            }
        })

        if(!response) return res.status(500).json({ messageError: "Ce blog n'exsite pas!" });

        res.json(response)
       
      } catch (error) {
        res.status(500).json({ messageError: 'Erreur serveur' });
      }
}


export const createBlogType = async(req, res) =>{

    // CREATION DU DOSSIER BLOG
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const dossierBlog = path.join(__dirname, '..', 'assets', 'blog');

    if (fs.existsSync(dossierBlog)) {
    } else {
        fs.mkdirSync(dossierBlog);      
    }

    try {
        const type = req.body.type.toLowerCase();
        const token = req.body.token;

        if (!token) return res.json({ messageError: 'Token manquant, veuillez reconnecter' });
            
        const decodedToken = jwt.decode(token);  
        if (!decodedToken || !decodedToken.user) return res.json({ messageError: 'Token invalide' });
        
        const blogTypeExist = await prisma.typeBlog.findUnique({
          where: {
              type: type
          },
        });

        if (blogTypeExist) {
            return res.json({ messageError: "Ce type de blog existe déjà!" });
        }
    
        
        if(type === '') return res.json({messageError:"Veuillez ajouter le nom du blog!"})
  

        const dossierTypeBlog = path.join(__dirname, '..', 'assets', 'blog', `${type}`);
        if (fs.existsSync(dossierTypeBlog)) {
        } else {
            fs.mkdirSync(dossierTypeBlog);      
        }
        
        // const id = decodedToken.user;
        // const type = "add"
        // const pk_user= decodedToken.user;
        // const texte = `Création d'une nouvelle blog : "${typeBlog}"`

        // Créez le nouveau type de blog si n'existe pas
        const newBlogType = await prisma.typeBlog.create({
            data: {
                type: type
            },
        });

        res.status(201).json(newBlogType);
       
      } catch (error) {
        res.status(500).json({ messageError: 'Erreur serveur' });
      }
}


export const updateBlogType = async(req, res) =>{
    
}