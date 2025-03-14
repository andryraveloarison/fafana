import fs from "fs"
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import { PrismaClient } from '@prisma/client'
import xlsx from 'xlsx';


const prisma = new PrismaClient()


/**
 * COMPTE ELECTRICITE EAU CIBLE
 */
export const importerCompteElectriciteEauCible = async (req, res) => {
    if (!req.files || !req.files.file) {
        return res.status(400).json({ message: "Aucun fichier téléchargé.", success: false });
    }

    const file = req.files.file;
    const feuille = req.body.feuille;
    
    if(!feuille) return res.json({ message: "Veuillez ajouter le numéro de la feuille!", success: false });

    try {
        // console.log('Fichier temporaire:', file.tempFilePath);
        // Lire le fichier Excel depuis le chemin temporaire
        const workbook = xlsx.readFile(file.tempFilePath);

        // Lire la première feuille
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convertir les données de la feuille en JSON
        const data = xlsx.utils.sheet_to_json(worksheet);
        fs.unlinkSync(file.tempFilePath);


        for (let row of data) {
                const agenceCode = row.code_agence
                const referenceClient = row.installation
                const jan = row.jan
                const fev = row.fev
                const mars = row.mars
                const avril = row.avril
                const somme = row.cons_somme
                const tarif = row.tarif
                const designation = row.designation
                const categorie = row.categorie
                const type = row.type
                const classement = row.classement
                

                await prisma.compteElectriciteEauCible.create({
                    data:{
                        code_agence: agenceCode.toString(), 
                        referenceClient : referenceClient,
                        jan : parseFloat(jan),
                        fev : parseFloat(fev),
                        mars : parseFloat(mars),
                        avril : parseFloat(avril),
                        somme : parseFloat(somme),
                        tarif : tarif.toString(),
                        designation : designation.toLowerCase(),
                        categorie : parseInt(categorie),
                        type : type.toLowerCase(),
                        classement : parseInt(classement)
                    }
                })
        }
        console.log("Données bien ajoutées");
        
        res.status(201).json({ message: "Données bien ajoutées", success: true });
    } catch (err) {
        res.status(500).json({ message: err.message, success: false });
    }
    
};


export const deleteCompteElectriciteEauCible = async (req, res) => {
    try {
      await prisma.compteElectriciteEauCible.deleteMany({});
  
      await prisma.$executeRaw`ALTER SEQUENCE "CompteElectriciteEauCible_id_seq" RESTART WITH 1;`;
  
      res.status(200).json({ message: "Toutes les données d'agence ont été supprimées et l'ID a été réinitialisé", success: true });
    } catch (error) {
      res.status(500).json({ message: error.message, success: false });
    }
};








/**
 * AGENCE
 */
export const importerAgenceExcel = async (req, res) => {
    if (req.files === null) return res.json({ message: "Veuillez insérer une image!", success: false });
    const file = req.files.file;
    const feuille = req.body.feuille;

    if(!feuille) return res.json({ message: "Veuillez ajouter le numéro de la feuille!", success: false });

    try {
        const workbook = xlsx.readFile(`data/${file.name}`);
        
        const sheet_name_list = workbook.SheetNames;
        const sheet = workbook.Sheets[sheet_name_list[parseInt(feuille) - 1]]; // Prendre la première feuille
        const data = xlsx.utils.sheet_to_json(sheet);

        // Vérifier si des données existent
        if (data.length === 0) {
            return res.status(400).json({ message: "Aucune donnée trouvée dans la feuille Excel", success: false });
        }
    

    
        for (let row of data) {
            const agenceCode = row.code_agence;
            console.log("agenceCode : ", agenceCode);
    
            const agence = row.agence;
            const tourneId = row.id_tourne;
            const communeId = row.id_commune;
            const commune = row.commune;
            const zoneId = row.id_zone;
            const province = row.Province;
    
            // Exemple d'ajout de données (commenté ici)
            await prisma.agence.create({
                data: {
                    agenceCode: agenceCode.toString(),
                    agence: agence.toLowerCase(),
                    tourneId: tourneId.toString(),
                    communeId: parseInt(communeId),
                    commune: commune.toLowerCase(),
                    zoneId: zoneId.toString(),
                    province: province.toLowerCase()
                }
            });
        }
        console.log("Données bien ajoutées");
    
        res.status(201).json({ 
            message: "Données bien ajoutées",
            success: true
        });
    } catch (err) {
        console.error("Erreur : ", err);
        res.status(500).json({ message: err.message, success: false });
    }

    
    // try {
    //     console.log("file : ",file);
    //     console.log("feuille ; ",feuille);
        
        
    //     const workbook = xlsx.read(file.data, { type: 'buffer' });
    //     // const workbook = xlsx.read(file.data, { type: 'buffer', raw: true });
    //     console.log("workbook : ",workbook);
        
    //     const sheet_name_list = workbook.SheetNames;
    //     console.log("sheet_name_list : ",sheet_name_list);
        
    //     // Log le nom de la feuille sélectionnée
    //     const sheetName = sheet_name_list[parseInt(feuille) - 1];
    //     console.log("Nom de la feuille : ", sheetName);
        
    //     // const sheet = workbook.Sheets[sheetName]; // Sélectionner la feuille par son nom
    //     // const data = xlsx.utils.sheet_to_json(sheet, {
    //     //     header: 1, // Retourne les données brutes sans transformer les lignes en objets
    //     //     raw: true, // Garde les données telles quelles (sans les convertir)
    //     // });
    //     // console.log("data brut : ", data);

    //     const data = xlsx.utils.sheet_to_json(sheet);

    //     console.log("data : ",data);
        
        
    //     // let entetes = []
    //     if (data.length > 0) {
    //         entetes = Object.keys(data[0]);
    //     }

    //     for (let row of data) {
    //             const agenceCode = row.code_agence
    //             console.log("agenceCode : ",agenceCode);
                
    //             const agence = row.agence
    //             const tourneId = row.id_tourne
    //             const communeId = row.id_commune
    //             const commune = row.commune
    //             const zoneId = row.id_zone
    //             const province = row.Province


    //             // await prisma.agence.create({
    //             //     data:{
    //             //         agenceCode: agenceCode.toString(), 
    //             //         agence : agence.toLowerCase(),
    //             //         tourneId : tourneId.toString(),
    //             //         communeId : parseInt(communeId),
    //             //         commune : commune.toLowerCase(),
    //             //         zoneId : zoneId.toString(),
    //             //         province : province.toLowerCase()
    //             //     }
    //             // })
    //         }
    //     // console.log("Données bien ajoutées");
        
    //     res.json({ messageSuccess: "Données bien ajoutées" });
    // } catch (err) {
    //     res.status(500).json({ message:err.message, success: false });
    // }
    
};


export const deleteAllAgence = async (req, res) => {
    try {
      await prisma.agence.deleteMany({});
  
      await prisma.$executeRaw`ALTER SEQUENCE "Agence_id_seq" RESTART WITH 1;`;
  
      res.json({ messageSucces: "Toutes les données d'agence ont été supprimées et l'ID a été réinitialisé" });
    } catch (error) {
      res.status(500).json({ messageError: 'Erreur serveur' });
    }
};