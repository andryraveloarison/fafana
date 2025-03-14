import fs from "fs"
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import jwt from "jsonwebtoken";
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const getAllExpert = async(req, res) => {
    try {
        
        const response = await prisma.expert.findMany({
            include: {
                typeExperts: true,
            },
        })
        
        res.status(200).json({
            message: "Listes des experts",
            TotalCount: response.length,
            Data: response,
            success: true,
          });
    } catch (error) {
        res.status(500).json({ message: error.message, success: false });
    }
}


// include: {
//     zone:true
// },

export const getExpertById = async(req, res) => {
    try {
        const idExpert = req.body.idExpert
        
        const response = await prisma.expert.findUnique({
            where: {
                id: parseInt(idExpert),
            },
            include: {
                typeExperts: true,
            },
        });

        if (!response) {
            return res.status(404).json({ messageError: "Expert not found" });
        }
        res.json(response)
    } catch (error) {
        
    }
}


export const getExpertByZone = async (req, res) => {
    try {
        const zoneId = req.body.zoneId; // Assuming the zone ID is passed as a URL parameter

        const experts = await prisma.expert.findMany({
            where: {
                zoneId: zoneId,
            },
            include: {
                Zone: true,
                typeExperts: true,
            },
            orderBy: {
                stat:'desc'
            },
        });

        if (experts.length === 0) {
            return res.status(404).json({ messageError: "No experts found for this zone" });
        }

        res.json(experts);
    } catch (error) {
        res.status(500).json({ messageError: "Server error" });
    }
};


export const createExpert = async (req, res) => {
    if (req.files === null) return res.json({ messageError: "Veuillez insérer une image!" });

    const { nom, email, phone, whatsapp, facebook, linkdin, zoneId, certification } = req.body;
    const image = req.files.image;

    if (!nom) return res.json({ messageError: "Veuillez ajouter le nom de l'expert!" });
    if (!email) return res.json({ messageError: "Veuillez ajouter l'email de l'expert!" });
    if (!phone) return res.json({ messageError: "Veuillez ajouter son numéro téléphone!" });
    if (!certification) return res.json({ messageError: "Veuillez ajouter ces certificats!" });
    if (!zoneId) return res.json({ messageError: "Veuillez ajouter son quartier!" });

    try {
        const existingExpert = await prisma.expert.findFirst({
            where: {
                OR: [
                    { nom: nom },
                    { email: email },
                    { phone: phone }
                ]
            }
        });

        if (existingExpert) {
            return res.json({ messageError: "Cet expert existe déjà avec le même nom, email ou numéro de téléphone!" });
        }

        const fileSize = image.data.length;
        const ext = path.extname(image.name);
        const fileName = image.md5 + ext;
        const allowedTypes = ['.png', '.jpg', '.jpeg'];

        if (!allowedTypes.includes(ext.toLowerCase())) return res.json({ messageError: "Image invalide" });
        if (fileSize > 5000000) return res.json({ messageError: "Image devrait être moins de 5 MB" });

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        const dossierEmploye = path.join(__dirname, '..', 'assets', 'expert');

        if (!fs.existsSync(dossierEmploye)) {
            fs.mkdirSync(dossierEmploye);
        }

        const imagePath = path.join(dossierEmploye, fileName);
        const url = `${req.protocol}://${req.get("host")}/expert/${fileName}`;

        image.mv(imagePath, async (err) => {
            if (err) return res.status(500).json({ messageError: err.message });

            try {
                await prisma.expert.create({
                    data: {
                        nom,
                        email,
                        phone,
                        whatsapp,
                        facebook,
                        linkdin,
                        image: fileName,
                        url,
                        stat: 0,
                        zoneId: parseInt(zoneId),
                        certification
                    }
                });

                res.json({ messageSuccess: `L'expert ${nom} a été bien ajouté avec succès` });
            } catch (error) {
                res.json({ messageError: "Erreur d'enregistrement!" });
            }
        });
    } catch (error) {
        return res.json({ messageError: `Erreur lors de la création de l'expert: ${error.message}` });
    }
};


export const createExpertWithTypeExperts = async (req, res) => {
    if (req.files === null) return res.status(403).json({ message: "Veuillez insérer une image!", success: false });

    const { tel1, tel2, adresse, typeExpertIds } = req.body;
    const image = req.files.image;
    const nom = req.body.nom.toLowerCase()
    const prenom = req.body.prenom.toLowerCase()
    const email = req.body.email.toLowerCase()

    let typeExpertIdsArray;

    if (typeof typeExpertIds === 'string') {
        // Convertir la chaîne en tableau
        typeExpertIdsArray = [typeExpertIds];
    }else{
        typeExpertIdsArray = typeExpertIds;
    }


    if (!nom) return res.status(403).json({ message: "Veuillez ajouter le nom de l'expert!", success: false });
    if (!prenom) return res.status(403).json({ message: "Veuillez ajouter le prenom de l'expert!", success: false });
    if (!tel1 && !tel2) return res.status(403).json({ message: "Veuillez ajouter au moins un numéro de téléphone!", success: false });
    if (!adresse) return res.status(403).json({ message: "Veuillez ajouter une adresse!", success: false });
    if (!typeExpertIdsArray || !Array.isArray(typeExpertIdsArray) || typeExpertIdsArray.length === 0) return res.status(403).json({ message: "Veuillez ajouter au moins un type d'expert!", success: false });

    try {
        const existingExpert = await prisma.expert.findFirst({
            where: {
                AND: [
                    { nom: nom },
                    { prenom: prenom},
                    { email: email },
                    { tel1: tel1 }
                ]
            }
        });

        if (existingExpert)  return res.status(403).json({ message: "Cet expert existe déjà avec le même nom, prenom, email ou numéro de téléphone!" , success: false});
        

        const fileSize = image.data.length;
        const ext = path.extname(image.name);
        const fileName = image.md5 + ext;
        const allowedTypes = ['.png', '.jpg', '.jpeg'];

        if (!allowedTypes.includes(ext.toLowerCase())) return res.status(403).json({ message: "Image invalide" });
        if (fileSize > 5000000) return res.stats(403).json({ message: "Image devrait être moins de 5 MB" });

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        const dossierEmploye = path.join(__dirname, '..','..', 'assets', 'expert');

        if (!fs.existsSync(dossierEmploye)) {
            fs.mkdirSync(dossierEmploye);
        }

        const imagePath = path.join(dossierEmploye, fileName);
        const url = `/expert/${fileName}`;

   
        image.mv(imagePath, async (err) => {
            if (err) return res.status(500).json({ message: err.message });

            try {
                await prisma.expert.create({
                    data: {
                        nom,
                        prenom,
                        tel1,
                        tel2,
                        email,
                        adresse,
                        image: fileName,
                        url,
                        typeExperts: {
                            connect: typeExpertIdsArray.map(id => ({ id: parseInt(id) }))
                        }
                    }
                });

                res.json({ message : `L'expert ${nom} a été bien ajouté avec succès`, success: true });
            } catch (error) {
                res.json({ message: error.message, success: false });
            }
        });
    } catch (error) {
        res.json({ message: error.message, success: false });
    }
};


export const updateExpert = async (req, res) => {
    const idExpert = req.body.idExpert;

    const expert = await prisma.expert.findUnique({
        where: { id: parseInt(idExpert) },
        include: { typeExperts: true }
    });

    if (!expert) return res.status(404).json({ message: "Expert introuvable!", success: false });

    let fileName = expert.image;
    let filepath = '';
    let image = '';

    if (req.files !== null) {
        image = req.files.image;
        const fileSize = image.data.length;
        const ext = path.extname(image.name);
        fileName = image.md5 + ext;
        const allowedType = ['.png', '.jpg', '.jpeg'];

        if (!allowedType.includes(ext.toLowerCase())) return res.status(400).json({ message: "Format de fichier non autorisé", success: false });
        if (fileSize > 5000000) return res.status(400).json({ message: "Image devrait être moins de 5 MB", success: false });

        filepath = `./assets/expert/${expert.image}`;
    }

    const nom = req.body.nom.toLowerCase();
    const prenom = req.body.prenom.toLowerCase();
    const email = req.body.email;
    const tel1 = req.body.tel1;
    const tel2 = req.body.tel2;
    const adresse = req.body.adresse;
    const url = `/expert/${fileName}`;
    const typeExpertIds = req.body.typeExpertIds;
    

    
    try {
        // Mise à jour de l'expert avec les nouvelles informations
        let data = {}

        if(typeExpertIds.length <= 1){
            data = {
                nom,
                prenom,
                email,
                tel1,
                tel2,
                adresse,
                image :  fileName,
                url
            }
        }else{
            data = {
                nom,
                prenom,
                email,
                tel1,
                tel2,
                adresse,
                image :  fileName,
                url,
                // Mise à jour des types d'experts
                typeExperts : {
                    set: typeExpertIds.map(id => ({ id: parseInt(id) }))
                }
            }
        }

        const updatedExpert = await prisma.expert.update({
            where: { id: parseInt(idExpert) },
            data: data
        });

        // let  filepath2 = `./assets/expert/Ezaezee.jpg`;

        // Gestion du fichier image
        if (filepath) {
            try {
                fs.unlinkSync(filepath); 
            } catch (err) {
                console.log("L'image n'existe pas");
            }
        }
        
        if (req.files !== null) {
            image.mv(`./assets/expert/${fileName}`, (err) => {
                if (err) return res.status(500).json({ message: err.message, success: false });
            });
        }

        res.status(200).json({ message: "Modification effectuée avec succès", Data: updatedExpert, success: true });
    } catch (error) {
        res.status(500).json({ message: error.message, success: false });
    }
};


export const deleteInstallation = async(req, res) => {
    const idType = req.body.idType
    const typeInstallation = await TypeInstallation.findOne({
        where:{
            id: idType
        }
    })
    

    const token = req.body.token;
    if (!token) {
        return res.json({ messageError: 'Token is missing' });
      }
    const decodedToken = jwt.decode(token); 
    if (!decodedToken || !decodedToken.user) {
        return res.json({ messageError: 'Invalid token' });
    }
    const id = decodedToken.user;
    const type = "delete"
    const texte = `Supression de type d'installation ${typeInstallation.nom}`

    if(!typeInstallation) return res.json({messageError: "Type d'installation introuvable!"})

    const pk_status = "3"


    const __filename_delete = fileURLToPath(import.meta.url);
    const __dirname_delete = dirname(__filename_delete);
    const dossierImageSupprimer = path.join(__dirname_delete, '..', 'assets', 'corbeille');
        
    if(fs.existsSync(dossierImageSupprimer)) {
    } else {
        fs.mkdirSync(dossierImageSupprimer);      
    }

    let fileName = ''
    let filepath = ''
    let a = typeInstallation.image
    let image = req.files.a

    console.log(image);

    // image = req.files.image
    // const ext = path.extname(image.name)
    // fileName = image.md5 + ext

    filepath = `./assets/typeinstallation/${typeInstallation.image}`
    fileName = typeInstallation.image
    // image.mv(`./assets/corbeille/${fileName}`, (err) => {
    //     if(err) return res.json({messageError:"Erreur d'ajout de l'image"})
    // })

    try{
        // await Category.update({pk_status},{
        //     where:{
        //         id: idCategory
        //     }
        // })
        // await Action.create({texte: texte, type, pk_user: id, pk_status: "1"})
        res.json({messageSucces:"La suppression a été effectué avec succès"})
    }catch(error){
        return res.json({messageError:`Erreur lors de la création du dossier: ${error.message}`})
    }
}

