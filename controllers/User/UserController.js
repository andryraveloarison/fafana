import jwt from "jsonwebtoken"
import { PrismaClient } from '@prisma/client'
import axios from "axios";
import fs from "fs"
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import { config } from 'dotenv';
import bcrypt from 'bcryptjs';
import nodemailer  from 'nodemailer';
import validator from 'validator';
import { v2 as cloudinary } from 'cloudinary';



config();



const SECRET_KEY = process.env.JWT_SECRET; 
const prisma = new PrismaClient()
const portAppareil = process.env.PORT_APPAREIL
const port_ecozipo = process.env.PORT_ECOZIPO;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Créer un transporteur
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: 'mickaelrkt20@gmail.com',
//     pass: 'cqpq lurc ogmr jnei'
//   }
// });
const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',  
  port: 465,  
  secure: true,  // 'false' pour TLS, 'true' pour SSL
  auth: {
    user: 'support@ecozipo.com',  
    pass: 'Ecozipo@2024'   
  }
});


export const sendMailTest = async (req, res) => {
  const { email, validationCode } = req.body;

  const mailOptions = {
    from: 'support@ecozipo.com',
    to: email,
    subject: 'CODE DE VALIDATION ECOZIPO',
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <div style="text-align: center">
          <img src="cid:logo_image" alt="Image de validation" style="max-width: 60%; height: auto; margin-top: 20px; margin-bottom: 20px;" />
          <p style="font-size: 16px; margin-top: 20px;">
            Nous vous remercions pour votre inscription. Veuillez trouver ci-dessous votre code de validation : <strong>${validationCode}</strong>
          </p>
          <p style="font-size: 14px; margin-top: 10px;">
            Ce code est valable pendant 30 minutes. Si vous n'avez pas effectué cette demande, merci d'ignorer ce message.
          </p>
          <br/>
        </div>
        <p style="font-size: 16px;">
          Cordialement,<br/>
          L’équipe ECOZIPO
        </p>
      </div>
    `,
    attachments: [
      {
        filename: 'logo_white.png',
        path: 'https://ecozipo-codesource.onrender.com/default/logo_white.png',  
        cid: 'logo_image'  
      }
    ]
  
  };

  try {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Erreur lors de l\'envoi : ', error);
        return res.status(500).json({ messageError: "Erreur lors de l'envoi de l'email" });
      }
      res.status(201).json({
        messageSuccess: "Email envoyé avec succès: " + info.response,
        data: mailOptions
      });
    });
  } catch (error) {
    console.error("Erreur dans le bloc try-catch : ", error);
    res.status(500).json({ messageError: "Erreur serveur" });
  }
};

export const updateUrlUser = async (req, res) => {
  try {
    let apiUrl = req.body.apiUrl;
    
    // Récupérer tous les utilisateurs avec leur URL
    const users = await prisma.utilisateur.findMany({
      select: {
        id: true,
        url: true,
      },
    });

    // Filtrer les utilisateurs dont l'URL contient l'apiUrl
    const usersToUpdate = users.filter((user) => user.url && user.url.includes(apiUrl));

    if (usersToUpdate.length === 0) {
      return res.status(200).json({
        msg: "Aucun utilisateur n'a une URL contenant l'apiUrl fourni.",
        status: true
      });
    }

    // Mapper les utilisateurs pour mettre à jour leurs URLs
    const updates = usersToUpdate.map((user) => {
      // Remplacer l'apiUrl dans l'URL de l'utilisateur
      const updatedUrl = user.url.replace(apiUrl, ''); // Retirer l'apiUrl de l'URL
      console.log('====================================');
      console.log("updatedUrl: ", updatedUrl);
      console.log('====================================');

      return prisma.utilisateur.update({
        where: { id: user.id },
        data: {
          url: updatedUrl,
        },
      });
    });

    // Attendre que toutes les mises à jour soient terminées
    await Promise.all(updates);

    // Récupérer à nouveau les utilisateurs avec leurs nouvelles URLs
    const updatedUsers = await prisma.utilisateur.findMany({
      select: {
        id: true,
        url: true,
      },
    });

    // Répondre avec les utilisateurs et un message de succès
    res.status(200).json({
      msg: "URLs mises à jour avec succès.",
      data: updatedUsers,
      status: true
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour des URLs :', error);
    res.status(500).json({
      msg: "Erreur lors de la mise à jour des URLs.",
      status: false
    });
  }
};




const sendValidationEmail = async(email, validationCode, texte) => {

  const mailOptions = {
    from: 'support@ecozipo.com',
    to: email,
    subject: 'CODE DE VALIDATION ECOZIPO',
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <div style="text-align: center">
          <img src="cid:logo_image" alt="Image de validation" style="max-width: 60%; height: auto; margin-top: 20px; margin-bottom: 20px;" />
          <p style="font-size: 16px; margin-top: 20px;">
            ${texte}. Veuillez trouver ci-dessous votre code de validation : <strong>${validationCode}</strong>
          </p>
          <p style="font-size: 14px; margin-top: 10px;">
            Ce code est valable pendant 30 minutes. Si vous n'avez pas effectué cette demande, merci d'ignorer ce message.
          </p>
          <br/>
        </div>
        <p style="font-size: 16px;">
          Cordialement,<br/>
          L’équipe ECOZIPO
        </p>
      </div>
    `,
    attachments: [
      {
        filename: 'logo_white.png',
        path: 'https://ecozipo-codesource.onrender.com/default/logo_white.png',  
        cid: 'logo_image'  
      }
    ]
  
  };

  try {
    return transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Erreur lors de l\'envoi : ', error);
        return res.status(500).json({ messageError: "Erreur lors de l'envoi de l'email" });
      }
      console.log("Email envoyé avec succès: " + info.response)  
    });
  } catch (error) {
    console.error("Erreur dans le bloc try-catch : ", error);
  }
};



// const sendValidationEmail = (email, validationCode) => {
//   const mailOptions = {
//     from: 'support@ecozipo.com',
//     to: email,
//     subject: 'Validation de votre compte',
//     text: `Votre code de validation est : ${validationCode}`
//   };

//   return transporter.sendMail(mailOptions);
// };

const generateValidationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};


export const valide = async (req, res) => {
  const { email, validationCode } = req.body;

  try {
    const user = await prisma.utilisateur.findFirst({
      where: { email }
    });

    if (user && user.validationCode === validationCode) {
      await prisma.utilisateur.update({
        where: { id:user.id },
        data: { isValidated: true, validationCode: null }
      });

      const typeUserId = user.typeUserId;
      const token = jwt.sign({
        user: user.id,
        email: user.email
      }, SECRET_KEY, { expiresIn: '1h' });

      res.status(200).json({ 
        token, 
        typeUserId,
        message: 'Compte validé avec succès.',
        success: true
       });
    } else {
      res.status(400).json({ message: 'Code de validation incorrect.', success: false });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: `Erreur lors de la validation du compte. ${error.message}`, success: false });
  }
};


export const deleteAllDataBD = async (req, res) => {
  try {
    // DELETE NOTIFICATION
    await prisma.notification.deleteMany({});
    await prisma.$executeRaw`ALTER SEQUENCE "Notification_id_seq" RESTART WITH 1;`;


    // DELETE AVIS
    await prisma.avis.deleteMany({});
    await prisma.$executeRaw`ALTER SEQUENCE "Avis_id_seq" RESTART WITH 1;`;


    // DELETE USER NOTIF BLOG
    await prisma.utilisateurBlogNotif.deleteMany({});
    await prisma.$executeRaw`ALTER SEQUENCE "UtilisateurBlogNotif_id_seq" RESTART WITH 1;`;


    // DELETE LITIGE
    await prisma.litige.deleteMany({});
    await prisma.$executeRaw`ALTER SEQUENCE "Litige_id_seq" RESTART WITH 1;`;


    // DELETE CALCUL ELECTRICITE EAU
    await prisma.calculElectriciteEau.deleteMany({});
    await prisma.$executeRaw`ALTER SEQUENCE "CalculElectriciteEau_id_seq" RESTART WITH 1;`;


    // DELETE COMPTEELECTRICITEEEAU
    await prisma.compteElectriciteEau.deleteMany({});
    await prisma.$executeRaw`ALTER SEQUENCE "CompteElectriciteEau_id_seq" RESTART WITH 1;`;

    // DELETE USER APPAREIL
    await prisma.userAppareil.deleteMany({});
    await prisma.$executeRaw`ALTER SEQUENCE "UserAppareil_id_seq" RESTART WITH 1;`;


    // DELETE TYPE APPAREIL (groupe user)
    await prisma.typeAppareil.deleteMany({});
    await prisma.$executeRaw`ALTER SEQUENCE "TypeAppareil_id_seq" RESTART WITH 1;`;


    // DELETE ALL VALEUR APPAREIL
    await axios.delete(`${portAppareil}/deleteallvaleurappareil`);


    // DELETE ALL APPAREIL
    await axios.delete(`${portAppareil}/deleteallappareil`);

    // DELETE UTILISATEUR
    // await prisma.utilisateur.deleteMany({});
    // await prisma.$executeRaw`ALTER SEQUENCE "Utilisateur_id_seq" RESTART WITH 1;`;



    res.json({ 
      messageSucces: "Toutes les données ont été supprimées et l'ID a été réinitialisé",
      table : "Notification, Avis, Notif user, Litige, CalculEnergie, CompteEnergie, UserAppareil, TypeAppareil, ValeurAppareil, Appareil, Utilisateur"
     });
  } catch (error) {
    res.status(500).json({ messageError: 'Erreur serveur' });
  }
};



export const register = async(req, res) => {
  try {
      const { email, password, typeUserId } = req.body;

      if (!email) return res.json({ messageError: "Veuillez ajouter une Email!" });
      if (!password) return res.json({ messageError: "Veuillez ajouter le mot de passe!" });

      // Vérifier si l'email est valide
      if (!validator.isEmail(email)) {
          return res.json({ messageError: "Veuillez fournir une adresse email valide!" });
      }

      if (!validator.isStrongPassword(password, {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
      })) {
        return res.status(400).json({ message: 'Le mot de passe n\'est pas assez sécurisé. Il doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un symbole.' });
      }

      // Vérifier si l'utilisateur existe déjà
      const userExists = await prisma.utilisateur.findFirst({
          where: { email }
      });

      if (userExists) return res.status(400).json({ messageError: "Cette email existe déjà!" });

      // Hashage du mot de passe
      const hashedPassword = await bcrypt.hash(password, 10);

      // Conversion de typeUserId en entier
      const typeUserIdInt = parseInt(typeUserId, 10);

      const validationCode = generateValidationCode();



      await sendValidationEmail(email, validationCode, "Nous vous remercions pour votre inscription");
      
      // Création de l'utilisateur
      try {
          await prisma.utilisateur.create({
              data: {
                  email,
                  password: hashedPassword,
                  typeUserId: typeUserIdInt,
                  validationCode
              }
          });
          res.json({ messageSucces: `Utilisateur créé. Veuillez vérifier votre e-mail pour valider votre compte.` });
      } catch (error) {
          res.json({ messageError: "Erreur d'enregistrement!" });
      }

  } catch (error) {
      res.json({ error: 'Erreur serveur' });
  }
};


export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (email === '') return res.status(400).json({ msg: "Veuillez ajouter votre email!", status: false });
    if (password === '') return res.status(400).json({ msg: "Veuillez ajouter votre mot de passe!", status: false });

    const user = await prisma.utilisateur.findFirst({ where: { email } });

    // Vérifier si l'email est valide
    if (!validator.isEmail(email)) {
      return res.status(400).json({ msg: "Veuillez fournir une adresse email valide!", status: false });
    }

    if (!user) {
      return res.status(400).json({ msg: "Nom d'utilisateur incorrect", status: false });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch)  return res.status(400).json({ msg: "Mot de passe incorrect", status: false });
    

    if(user.isValidated === false) return res.status(400).json({ msg: "Veuillez confirmer votre compte!", status: false });

    const typeUserId = user.typeUserId;
    

    const token = jwt.sign({
      user: user.id,
      email: user.email
    }, SECRET_KEY, { expiresIn: '1h' });

    res.json({ 
      token, 
      typeUserId,
      status: true
    });
  } catch (error) {
    res.status(500).json({ msg: 'Erreur serveur', status: false });
  }
};


export const sendMailForgotPassword = async (req, res) => {
  try {
    const email = req.body.email;

    if (email === '') return res.json({ messageError: "Veuillez ajouter votre Email!" });

    const user = await prisma.utilisateur.findFirst({ where: { email } });

    if (!validator.isEmail(email)) return res.status(400).json({ messageError: "Veuillez fournir une adresse email valide!" });
    if (!user) return res.json({ messageError: "Nom d'utilisateur introuvable" });


    const validationCode = generateValidationCode();


    // update code de validation
    await prisma.utilisateur.update({
      where: { id: user.id },
      data: { validationCode }
    });

    await sendValidationEmail(email, validationCode, "Nous vous remercions pour votre demande de réinitialisation de mot de passe");

    res.json({ 
      messageSucces: `La code de validation a été envoyé à votre adresse email ${email}`,
      data: validationCode
    });
  } catch (error) {
    res.status(500).json({ messageError: 'Erreur serveur' });
  }
};


export const ResetPassword = async (req, res) => {
  try {

    const { email, validationCode, password, confirmPassword } = req.body;

    if(!email) return res.json({ messageError: "Veuillez ajouter votre Email!" });
    if(!password) return res.json({ messageError: "Veuillez ajouter votre mot de passe!" });
    if(!validationCode) return res.json({ messageError: "Veuillez ajouter votre code de validation!" });
    

    // Vérifier si l'email est valide
    if (!validator.isEmail(email)) return res.json({ messageError: "Veuillez fournir une adresse email valide!" });
    
    // verifier si password et confirmPassword sont identiques
    if (password !== confirmPassword) return res.json({ messageError: "Les mots de passe ne correspondent pas!, veuillez réessayer!" });


    // Valider password
    if (!validator.isStrongPassword(password, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    }))return res.status(400).json({ message: 'Le mot de passe n\'est pas assez sécurisé. Il doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un symbole.' });
    

    const user = await prisma.utilisateur.findFirst({
      where: { email }
    });
    if (!user) return res.json({ messageError: "Nom d'utilisateur introuvable" });

    if (user && user.validationCode === validationCode) {

       // Hashage du mot de passe
       const hashedPassword = await bcrypt.hash(password, 10);

      //  update password
      await prisma.utilisateur.update({
        where: { id:user.id },
        data: { 
          password: hashedPassword,
          isValidated: true, 
          validationCode: null 
        }
      });

      res.status(200).json({ message: 'Votre mot de passe a été mis à jour avec succès.' });
    } else {
      res.status(400).json({ message: 'Code de validation incorrect.' });
    }
  } catch (error) {
    res.status(500).json({ messageError: 'Erreur serveur' });
  }
};


export const getTokenByID = async (req, res) => {
  try {
    const id = req.body.id;

    if (id === '') return res.json({ messageError: "Veuillez ajouter votre ID!" });
    
    const user = await prisma.utilisateur.findUnique({ where: { id: parseInt(id) } });

    if (!user) {
      return res.json({ messageError: "Utilisateur introuvable" });
    }

    const token = jwt.sign({
      user: user.id,
      email: user.email
    }, SECRET_KEY, { expiresIn: '1h' });

    res.json({ token });
  } catch (error) {
    res.status(500).json({ messageError: 'Erreur serveur' });
  }
};



export const sendMail = async (req, res) => {
  const { to_name, from_name, message } = req.body;

  const templateParams = {
    to_name: to_name,
    from_name: from_name,
    message: message,
  };

  try {
    const response = await axios.post("https://api.emailjs.com/api/v1.0/email/send", {
      service_id: process.env.EMAILJS_SERVICE_ID,
      template_id: process.env.EMAILJS_TEMPLATE_ID,
      user_id: process.env.EMAILJS_USER_ID,
      template_params: templateParams,
    });

    if (response.status === 200) {
      res.status(201).json({ messageSuccess: "Email envoyé avec succès" });
    } else {
      res.status(500).json({ messageError: "Erreur lors de l'envoi de l'email" });
    }
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email :", error);
    res.status(500).json({ messageError: "Erreur serveur" });
  }
};


export const getProfileDefaultUser = async(req, res) => {
  try {
    let data = []

    for (let index = 1; index <= 15; index++) {
      data.push({
        image: `profile${index}.jpg`,
        url: `/profileUser/profile${index}.jpg`,
        lien: `${port_ecozipo}/profileUser/profile${index}.jpg`,
      });
      
    }
    

    return res.status(200).json({
      messageSuccess: "Profile par défaut trouvée.",
      Data: data,
      success: true
    });
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
}

export const getProfileDefaultAdmin = async(req, res) => {
  try {
    let data = []

    for (let index = 1; index <= 15; index++) {
      data.push({
        image: `admin${index}.JPG`,
        url: `/profileUser/admin${index}.JPG`,
        lien: `${port_ecozipo}/profileUser/admin${index}.JPG`,
      });
      
    }
    

    return res.status(200).json({
      messageSuccess: "Profile par défaut trouvée.",
      Data: data,
      success: true
    });
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
}



export const updateUser = async(req, res) => {
  // Create folder profileUser
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const dossierProfileUser = path.join(__dirname, '..', 'assets', 'profileUser');

  if (fs.existsSync(dossierProfileUser)) {
  } else {
    fs.mkdirSync(dossierProfileUser);      
  }

  // 
  const token = req.body.token;
  try {
    if (!token) {
      return res.status(400).json({ messageError: 'Token manquant' });
    }

    const decodedToken = jwt.decode(token);

    if (!decodedToken || !decodedToken.user)  return res.json({ messageError: 'Invalid token' });
    

    const id = decodedToken.user;

    

    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id: parseInt(id) }
    });

    
    if (!utilisateur) {
      return res.status(404).json({ messageError: 'Utilisateur introuvable' });
    }

    let fileName = ''
    let image = ''
    let imageUrl = ''
    let public_id = ''
    
    let pseudo = req.body.pseudo; 
    // const pseudoExit = await prisma.utilisateur.findFirst({
    //   where:{
    //     pseudo: pseudo
    //   }
    // })
    // if(pseudoExit) return res.status(403).json({messageError:"Ce pseudo existe déjà!"})

    
    
    if(req.files === null || image === ""){
      fileName = utilisateur.image
      imageUrl = utilisateur.url
      
    }else{
      
        image = req.files.image
        const fileSize = image.data.length
        const ext = path.extname(image.name)
        fileName = image.md5 
        const allowedType = ['.png','.jpg','.jpeg']
        if(!allowedType.includes(ext.toLowerCase())) return res.json({messageError:"Images invalides"})
        if(fileSize > 5000000) return res.status(403).json({messageError:"L'image devrait être moins que  5 MB"})
          
          try {
            // Upload vers Cloudinary dans le dossier spécifié
            const result = await cloudinary.uploader.upload(image.tempFilePath, {
              folder: 'ecozipo/profileUser', // Dossier spécifique
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
          if (utilisateur.url && utilisateur.public_id !== public_id) {
            try {
              const publicIdAncien = utilisateur.public_id
              const result = await cloudinary.uploader.destroy(publicIdAncien);
              console.log("Image supprimée avec succès :", result);
            } catch (deleteError) {
              console.error("Erreur lors de la suppression de l'ancienne image :", deleteError);
              // Ne pas bloquer la requête si la suppression échoue, mais journaliser l'erreur
          }
          
        }
        
    }
    

    
    let nom = req.body.nom; 
    let phone = req.body.phone; 
    let adresse = req.body.adresse;
    let nbrAdulte = req.body.nbrAdulte
    let nbrEnfant = req.body.nbrEnfant
    let zoneId = req.body.zoneId
    // let url = `/profileUser/${fileName}`
    let url = imageUrl

    
    if(nom === '') nom = utilisateur.nom
    if(pseudo === '') pseudo = utilisateur.pseudo
    if(phone === '') phone = utilisateur.phone
    if(zoneId === '') zoneId = utilisateur.zoneId

    
    let data = {}
    if(utilisateur.typeUserId === 3){
      data = {
        nom,
        pseudo,
        email: utilisateur.email,
        password: utilisateur.password,
        isValidated: utilisateur.isValidated,
        validationCode: utilisateur.validationCode,
        adresse,
        phone,
        image : fileName,
        url: url,
        typeUserId: utilisateur.typeUserId,
        zoneId: parseInt(zoneId),
        nbrAdulte: nbrAdulte,
        nbrEnfant: nbrEnfant,
        public_id: public_id
      }

    }else{
      data = {
        nom,
        pseudo,
        email: utilisateur.email,
        password: utilisateur.password,
        isValidated: utilisateur.isValidated,
        validationCode: utilisateur.validationCode,
        adresse,
        phone,
        image : fileName,
        url: url,
        typeUserId: utilisateur.typeUserId,
        zoneId: parseInt(zoneId),
        nbrAdulte: 0,
        nbrEnfant: 0,
        public_id: public_id
      }
    }
   

   

    console.log("data : ",data);
    const idUser = utilisateur.id
    const updatetUser = await prisma.utilisateur.update({
      where: { id: idUser},
      data: data
    });

    // image.mv(`./assets/profileUser/${fileName}`, (err) => {
    //   if(err) return res.json({messageError:err.message})
    // })

    // if(utilisateur.image != null){
    //   const filepath = `./assets/profileUser/${utilisateur.image}`
    //   fs.unlinkSync(filepath)
    // }

    res.status(200).json({
      messageSucces:"Vos informations est bien modifié",
      data : updatetUser
    })

    
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
}


export const updateUserImageDefault = async(req, res) => {

  const {image, url, utilisateurId } = req.body;
  if(!image || !url || !utilisateurId) return res.status(400).json({ messageError: "L'image, l'url et l'id de l'utilisateur sont tous obligatoire", success: false });

  try {

    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id: parseInt(utilisateurId) }
    });
    if(!utilisateur) return res.status(400).json({ messageError: "L'utilisateur n'existe pas", success: false });
    
    let data = {
      image : image,
      url: url
    }
   
    const updatetUser = await prisma.utilisateur.update({
      where: { id: parseInt(utilisateurId)},
      data: data
    });

    res.status(201).json({
      messageSucces:"Votre profile est bien à jour",
      data : updatetUser,
      success: true
    })

    
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
}


export const updateUserTypeOfUser = async(req, res) => {
  const {typeUserId, utilisateurId } = req.body;
  if(!typeUserId || !utilisateurId) return res.status(400).json({ messageError: "L'typeUserId et l'id de l'utilisateur sont tous obligatoire", success: false });

  try {

    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id: parseInt(utilisateurId) }
    });
    if(!utilisateur) return res.status(400).json({ messageError: "L'utilisateur n'existe pas", success: false });
    
    // find if user type exist
    const typeUser = await prisma.typeUser.findUnique({
      where: { id: parseInt(typeUserId) }
    });
    if(!typeUser) return res.status(400).json({ messageError: "Le typeUser n'existe pas", success: false });

    let data = {
      typeUserId : parseInt(typeUserId)
    }
   
    const updatetUser = await prisma.utilisateur.update({
      where: { id: parseInt(utilisateurId)},
      data: data
    });

    res.status(201).json({
      messageSucces:`L'utilisateur ${utilisateur.email} est maintenant en mode ${typeUser.type}`,
      data : updatetUser,
      success: true
    })

    
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
}




export const verifyToken = async(req, res) => {
  const token = req.body.token

  if(token === '') return res.json({messageError:"Token manquante! Vous devez reconnecter!"})
  try {
    const decodedToken = jwt.decode(token);
    
    
    if (!decodedToken) {
      return res.json({ 
        messageError: 'Invalid token',
        isValid : false
      });
    }

    res.json({isValid : true, decodedToken})

    
    
  } catch (error) {
    return res.json({ error: 'Internal server error' });
  }
}


export const getUserByToken = async(req, res) => {
  const token = req.body.token; // Récupérer le token depuis le cookie

  if (!token) {
    return res.status(401).json({ messageError: 'Token non fourni' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.user;

    // Récupérer l'utilisateur à partir de l'ID
    const response = await prisma.utilisateur.findUnique({
      where:{
          id : parseInt(userId)
      }
    })
    if(!response) res.status(401).json({ messageError: 'Utilisateur introuvable'});

    res.json(response)

  } catch (error) {
    res.status(401).json({ messageError: 'Token invalide' });
  }
}


export const verifyInfoUser = async(req, res) => {
  const token = req.body.token;
  

  try {
    if (!token) {
      return res.status(400).json({ messageError: 'Token manquant' });
    }

    const decodedToken = jwt.decode(token);

    if (!decodedToken || !decodedToken.user) {
      return res.status(400).json({ messageError: 'Token invalide' });
    }

    const id = decodedToken.user;

    const user = await prisma.utilisateur.findUnique({
      where: { id: id }
    });

    if (!user) {
      return res.status(404).json({ messageError: 'Utilisateur introuvable' });
    }

    const { nom, pseudo, phone, image, url, pk_zone } = user;
    let incompleteInfoCount = 0;

    if (!nom) incompleteInfoCount++;
    if (!pseudo) incompleteInfoCount++;
    if (!phone) incompleteInfoCount++;
    if (!image) incompleteInfoCount++;
    if (!url) incompleteInfoCount++;
    if (!pk_zone) incompleteInfoCount++;

    let valid = true

    if(incompleteInfoCount > 0){
      valid = false
    }

    res.json({ complet : valid });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}


export const getAllUser = async(req, res) =>{
  try {

      const response = await prisma.utilisateur.findMany({
        include: {
          TypeUser: true,
          Zone: true
        }
        })
      res.status(200).json({
        message : 'Listes des utilisateurs',
        Data: response,
        totalCount: response.length,
        success: true
      })
     
    } catch (error) {
      res.status(500).json({ message: error.message, success: false });
    }
}


export const getUserById = async(req, res) =>{
  try {
      const id = req.body.id;
      const response = await prisma.utilisateur.findUnique({
        where: {
          id: parseInt(id)
        },
        include: {
          TypeUser: true,
          Zone: true
        }
        })
      res.json(response)
     
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
}





export const updateNotificationUser = async(req, res) => {
  try {
    let { utilisateurId, statusNotif } = req.body

    if(!utilisateurId) return res.status(400).json({ message: "L'id du utilisateur est obligatoire.", success: false });
    
    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id: parseInt(utilisateurId) }
    });
    if (!utilisateur)  return res.status(404).json({ messageError: "Utilisateur introuvable!" });
  
    const updatetUser = await prisma.utilisateur.update({
      where: { id: utilisateur.id},
      data: {
        statusNotif: statusNotif
      }
    });
  
    let message = `Vos alertes sont tout ${statusNotif === true ? "activé" : "éteint"}`

    // Émettre une notification via Socket.IO
    req.io.emit('notifStatusUser', {
      message: message,
      type: "alerte",
      utilisateurId : utilisateur.id,
      statusNotif: statusNotif
    });

    // create notification
    // await prisma.notification.create({
    //   data:{
    //       message: message,
    //       type: "alerte",
    //       utilisateurId : utilisateur.id
    // }})

    res.status(201).json({
      message: message,
      data: updatetUser,
      success: true
    });

    
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
}




export const decodePasswordUser = async (req, res) => {
  try {
    const { email } = req.body;

    if (email === '') return res.status(400).json({ msg: "Veuillez ajouter votre email!", status: false });

    const user = await prisma.utilisateur.findFirst({ where: { email } });

    // Vérifier si l'email est valide
    if (!validator.isEmail(email)) {
      return res.status(400).json({ msg: "Veuillez fournir une adresse email valide!", status: false });
    }

    if (!user)   return res.status(400).json({ msg: "Nom d'utilisateur incorrect", status: false });
    let password = user.password;

    console.log("password : ",password);
    
    

    const passwordMatch = bcrypt.decodeBase64(password)
    

    res.json({ 
      passwordMatch, 
    });
  } catch (error) {
    res.status(500).json({ msg: 'Erreur serveur', status: false });
  }
};
