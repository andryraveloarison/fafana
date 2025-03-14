import jwt from "jsonwebtoken";
import path, { dirname } from 'path';
import { PrismaClient } from '@prisma/client'
import fs from "fs"
import axios from 'axios'
import { config } from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';

config();

const prisma = new PrismaClient()
const port_ecozipo = process.env.PORT_ECOZIPO;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});



export const getAllBlog= async(req, res) =>{
  try {
      const response = await prisma.blog.findMany({
        orderBy: {
            id:'desc',
        },
        include: {
            TypeBlog: true
        },
      })
      res.json(response)
     
    } catch (error) {
      res.status(500).json({ messageError: 'Erreur serveur' });
    }
}


export const getBlogById = async(req, res) =>{
    try {
        const idBlog = req.body.idBlog

        const response = await prisma.blog.findUnique({
            where:{
                id : parseInt(idBlog)
            },
            include: {
                TypeBlog: true
            },
        })
        res.json(response)
       
      } catch (error) {
        res.status(500).json({ messageError: 'Erreur serveur' });
      }
}


export const getBlogByBlogType = async(req, res) =>{
    try {
        const typeBlogId = req.body.typeBlogId

        const response = await prisma.blog.findMany({
            where:{
                typeBlogId : parseInt(typeBlogId)
            },
            orderBy: {
                id:'desc',
            },
            include: {
                TypeBlog: true
            },
        })
        res.json(response)
       
      } catch (error) {
        res.status(500).json({ messageError: 'Erreur serveur' });
      }
}




/**
 * 
 * UPDATE TABLE URL
 */
export const updateUrlBlog = async (req, res) => {
    try {
  
      const blogs = await prisma.blog.findMany({
        select: {
          id: true,
          url: true,
        },
      });
  
      const updates = blogs.map((blog) => {
        const updatedUrl = blog.url.replace('http://localhost:5000', '');
  
        return prisma.blog.update({
          where: { id: blog.id },
          data: {
            url: updatedUrl,
          },
        });
      });
  
      await Promise.all(updates);
  
  
      res.status(200).json({
        msg: "URLs mises à jour avec succès.",
        data: blogs,
        status: true
      });
  
  
    } catch (error) {
      console.error('Erreur lors de la mise à jour des URLs :', error);
    }
};



const generateBlogContent = async (subject) => {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

  try {
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Vous êtes un expert en rédaction de blogs. Veuillez générer un titre concis en 10 mots maximum et une description détaillée en 30 mots maximum sur les sujets de ${subject}. Assurez-vous que le contenu est en français.`
          },
        ],
        max_tokens: 150, // Augmenter légèrement pour permettre des réponses complètes
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const content = response.data.choices[0].message.content.trim();

    // Séparer le contenu en lignes pour le titre et la description
    let [titre, description] = content.split('\n').filter(Boolean);


    // Post-traitement pour garantir le respect des limites
    titre = titre.split(' ').slice(0, 10).join(' '); // Limiter le titre à 10 mots
    description = description.split(' ').slice(0, 30).join(' '); // Limiter la description à 30 mots


    return { titre: titre , description: description};
  } catch (error) {
    console.error('Erreur lors de l’appel à l’API OpenAI :', error.response ? error.response.data : error.message);
    throw new Error('Échec de la génération de contenu avec l’API OpenAI');
  }
};

  

export const createBlog = async (req, res) => {
    try {
        let { titre, description } = ''
        const lien = req.body.lien;
        const reaction = 0;
        const typeBlogId = req.body.typeBlogId;
        let image = '';
        const token = req.body.token;
        const zoneId = req.body.zoneId;
        let url = '';
        let fileName = '';
        let imageUrl = ''
        let public_id = ''

        // if (!token) return res.json({ messageError: 'Token manquant, veuillez reconnecter' });

        // const decodedToken = jwt.decode(token);
        // if (!decodedToken || !decodedToken.user) return res.json({ messageError: 'Token invalide' });


        if(parseInt(typeBlogId) === 3){
            // Générer le contenu avec l'IA en français
            const rep = await generateBlogContent('électricité et eau');
            titre = rep.titre
            description = rep.description
        }else{
            titre = req.body.titre
            description = req.body.description
        }
        

        if (titre === '') return res.json({ messageError: 'Veuillez ajouter le titre de votre blog!' });
        if (description === '') return res.json({ messageError: 'Veuillez ajouter les descriptions du blog!' });
        if (typeBlogId === '') return res.json({ messageError: 'Veuillez séléctionner le type de votre blog!' });

        const blogExit = await prisma.blog.findFirst({
            where: {
                AND: [
                    { titre }
                ]
            }
        });
        if (blogExit) return res.json({ messageError: 'Ce blog existe déjà!' });

        const typeBlog = await prisma.typeBlog.findUnique({
            where: {
                id: parseInt(typeBlogId)
            }
        });

        if(parseInt(typeBlogId) === 3){
            fileName = "image_ia.png";
            imageUrl = `/default/image_ia.png`;
        }else{
            if (req.files) {
                image = req.files.image;
                const fileSize = image.data.length;
                const ext = path.extname(image.name);
                fileName = image.md5;
    
                const allowedType = ['.png', '.jpg', '.jpeg'];
    
                if (!allowedType.includes(ext.toLowerCase())) return res.json({ messageError: 'Image invalide' });
                if (fileSize > 5000000) return res.json({ messageError: 'Image devrait être moins de 5 MB' });
    
                try {
                  // Upload vers Cloudinary dans le dossier spécifié
                  const result = await cloudinary.uploader.upload(image.tempFilePath, {
                    folder: 'ecozipo/blog', // Dossier spécifique
                    public_id: fileName, // Nom unique pour l'image
                  });
      
                  fileName = fileName +"."+ result.format 
                  public_id = result.public_id
                  console.log("result : ",result);
                  
              
                  imageUrl = result.secure_url;
                  console.log("Image téléchargée avec succès sur Cloudinary : ", imageUrl);
                } catch (uploadError) {
                  console.error("Erreur lors de l'upload de l'image sur Cloudinary :", uploadError);
                  return res.status(500).json({
                    messageError: "Erreur lors de l'upload de l'image. Veuillez réessayer.",
                    error: uploadError.message,
                  });
                }

                // Suppression de l'ancienne image si elle existe
                if (blogExit.url && blogExit.public_id !== public_id) {
                  try {
                    const publicIdAncien = blogExit.public_id
                    const result = await cloudinary.uploader.destroy(publicIdAncien);
                    console.log("Image supprimée avec succès :", result);
                  } catch (deleteError) {
                    console.error("Erreur lors de la suppression de l'ancienne image :", deleteError);
                    // Ne pas bloquer la requête si la suppression échoue, mais journaliser l'erreur
                  }
                }

                // const ImageExit = await prisma.blog.findFirst({
                //     where: {
                //         image: fileName
                //     }
                // });
                // if (ImageExit) return res.json({ messageError: 'Cette image existe déjà' });
    
                // url = `/blog/${typeBlog.type}/${fileName}`;
    
                // image.mv(`./assets/blog/${typeBlog.type}/${fileName}`, (err) => {
                //     if (err) return res.json({ messageError: "Erreur d'ajout de l'image" });
                // });
            }
        }
        

        try {
            const newBlog = await prisma.blog.create({
                data: {
                    titre,
                    description,
                    lien,
                    reaction,
                    image: fileName,
                    url: imageUrl,
                    zoneId : parseInt(zoneId),
                    typeBlogId: parseInt(typeBlogId),
                    public_id: public_id
                }
            });

            // Émettre une notification via Socket.IO
            req.io.emit('newBlog', newBlog);

            res.status(201).json({ 
              messageSucces: `Le blog de ${typeBlog.type} ${titre} a été bien ajouté avec succès`,
              data: newBlog,
              success: true
             });
        } catch (error) {
            res.json({ messageError: error.message, success: false });
        }
    } catch (error) {
        res.status(500).json({ messageError: error.message, success: false });
    }
};


export const updateBlog = async(req, res) =>{
    const idBlog = req.body.idBlog;
    if(!idBlog) return res.status(400).json({ messageError: "idBlog is required", success:false });

    const blog = await prisma.blog.findUnique({
        where: { id: parseInt(idBlog) },
        include: { TypeBlog: true }
    });


    if (!blog) return res.status(404).json({ messageError: "Blog introuvable!", success:false });

    let fileName = blog.image;
    let filepath = '';
    let image = '';
    let imageUrl = ''
    let public_id = ''

    if (req.files !== null) {
        image = req.files.image;
        const fileSize = image.data.length;
        const ext = path.extname(image.name);
        fileName = image.md5;
        const allowedType = ['.png', '.jpg', '.jpeg'];

        if (!allowedType.includes(ext.toLowerCase())) return res.status(403).json({ messageError: "Image invalide", success:false });
        if (fileSize > 5000000) return res.status(403).json({ messageError: "Image devrait être moins de 5 MB", success:false });

        // filepath = `./assets/blog/${blog.TypeBlog.type}/${blog.image}`;

        try {
          const result = await cloudinary.uploader.upload(image.tempFilePath, {
            folder: 'ecozipo/blog', // Dossier spécifique
            public_id: fileName, // Nom unique pour l'image
          });

          fileName = fileName +"."+ result.format 
          public_id = result.public_id
          console.log("result : ",result);
          
      
          imageUrl = result.secure_url;
          console.log("Image téléchargée avec succès sur Cloudinary : ", imageUrl);
        } catch (uploadError) {
          console.error("Erreur lors de l'upload de l'image sur Cloudinary :", uploadError);
          return res.status(500).json({
            messageError: "Erreur lors de l'upload de l'image. Veuillez réessayer.",
            success: false
          });
        }

        console.log("blog.url : ",blog.url);
        console.log("blog.public_id : ",blog.public_id);
        console.log("public_id : ",public_id);
        
        // Suppression de l'ancienne image si elle existe
        if (blog.url && blog.public_id !== null && blog.public_id !== public_id) {
          try {
            const publicIdAncien = blog.public_id
            const result = await cloudinary.uploader.destroy(publicIdAncien);
            console.log("Image supprimée avec succès :", result);
          } catch (deleteError) {
            console.error("Erreur lors de la suppression de l'ancienne image :", deleteError);
            return res.status(500).json({ messageError: deleteError.message, success: false });
            // Ne pas bloquer la requête si la suppression échoue, mais journaliser l'erreur
          }
        }

    }else{
      fileName = blog.image
      imageUrl = blog.url
    }

    const titre = req.body.titre.toLowerCase() || blog.titre;
    const description = req.body.description || blog.description;
    const lien = req.body.lien || blog.lien
    const typeBlogId = req.body.typeBlogId || blog.typeBlogId

    // const typeBlog = await prisma.typeBlog.findUnique({
    //     where:{
    //       id: parseInt(typeBlogId)
    //     }
    // })
    
    // const url = `/blog/${typeBlog.type}/${fileName}`;
    
    
    try {
        // Mise à jour du blog avec les nouvelles informations
        let data = {
            titre,
            description,
            lien,
            image :  fileName,
            url : imageUrl,
            typeBlogId : parseInt(typeBlogId)
        }

        const updatedBlog = await prisma.blog.update({
            where: { id: parseInt(idBlog) },
            data: data
        });

        // console.log("filepath : ",filepath);
        // console.log(`fileName : ./assets/blog/${typeBlog.type}/${fileName}`);

        // // Gestion du fichier image
        // if (filepath) {
        //     fs.unlinkSync(filepath); // Supprime l'ancienne image
        // }

        // if (req.files !== null) {
        //     image.mv(`./assets/blog/${typeBlog.type}/${fileName}`, (err) => {
        //         if (err) return res.json({ messageError: "Erreur d'ajout de l'image" });
        //     });
        // }

        res.status(201).json({ 
          messageSuccess: "Modification effectuée avec succès", 
          data: updatedBlog,
          success: true
         });
    } catch (error) {
        res.status(500).json({ messageError: error.message, success: false });
    }
}



export const deleteBlog = async(req, res) =>{
  const idBlog = req.body.idBlog;
  if(!idBlog) return res.status(400).json({ messageError: "idBlog is required", success:false });

  const blog = await prisma.blog.findUnique({
      where: { id: parseInt(idBlog) },
  });


  if (!blog) return res.status(404).json({ messageError: "Blog introuvable!", success:false });


  // Suppression de l'ancienne image si elle existe
  if (blog.url) {

    const url = blog.url;
    const publicIdAncien = url.match(/ecozipo\/blog\/[^.]+/)[0];

    try {
      const result = await cloudinary.uploader.destroy(publicIdAncien);
      console.log("Image supprimée avec succès :", result);
    } catch (deleteError) {
      console.error("Erreur lors de la suppression de l'ancienne image :", deleteError);
      // return res.status(500).json({ messageError: deleteError.message, success: false });
      // Ne pas bloquer la requête si la suppression échoue, mais journaliser l'erreur
    }
  }



  try {
      // delete blog 
      await prisma.blog.delete({
        where: {
          id: parseInt(idBlog)
        }
      });
      


      res.status(201).json({ 
        messageSuccess: "Blog supprimé avec succès",
        data: null,
        success: true
       });
  } catch (error) {
      res.status(500).json({ messageError: error.message, success: false });
  }
}