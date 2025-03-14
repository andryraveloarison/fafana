import { PrismaClient } from '@prisma/client'
import jwt from "jsonwebtoken";
import { CalculTKwhEnAriaryTTC } from '../JiramaCalculController.js';

const prisma = new PrismaClient()


/**
 * GET ALL COMPTE ELECTRICITE EAU
 */
export const getAllCompteElectricite = async(req, res) =>{
  try {

    let response = {}
    response = await prisma.compteElectriciteEau.findMany({
        orderBy: {
            id:'asc',
        },
        include: {
            Utilisateur: true
        },
    })

    let WattIntensityTension = {}
    for (let index = 0; index < response.length; index++) {
    let id = response[index].id

    WattIntensityTension = await getWattIntensityTension(id)
    let puissanceWatt = WattIntensityTension.data.puissanceWatt
    let intensite = WattIntensityTension.data.intensite
    let tension = WattIntensityTension.data.tension
            
    await prisma.compteElectriciteEau.update({
        where: {
            id: id,
        },
        data: {
            puissanceWatt,
            intensite,
            tension
        },
    });
    }
        
    response = await prisma.compteElectriciteEau.findMany({
        orderBy: {
            id:'desc',
        },
        include: {
            Utilisateur: true
        },
    })

    res.status(200).json({
    message: "Listes de vos comptes électricité et eau",
    Data: response,
    success: true
    })
     
    } catch (error) {
      res.status(500).json({ message: error.message, success: false });
    }
}



/**
 * GET COMPTE ELECTRICITE BY ID
 */
export const getCompteElectriciteById = async(req, res) =>{
    try {
        const token = req.body.token;
        const idCompte = req.body.idCompte;
  
        if (!token) return res.json({ messageError: 'Token manquant, veuillez reconnecter' });
  
        const decodedToken = jwt.decode(token);  
        if (!decodedToken || !decodedToken.user) return res.json({ messageError: 'Token invalide' });
  
  
        const response = await prisma.compteElectriciteEau.findUnique({
            where:{
              id : parseInt(idCompte)
            },
            include: {
                Utilisateur: true
            },
        })
        if(!response) return res.status(404).json({ messageError: 'Compte introuvable!' });
        res.json(response)
       
      } catch (error) {
        res.status(500).json({ messageError: 'Erreur serveur' });
      }
  }
  



/**
 * GET COMPTE ELECTRICITE BY USER
 */
export const getCompteElectriciteByUser = async(req, res) =>{
try {
    const token = req.body.token;

    if (!token) return res.json({ messageError: 'Token manquant, veuillez reconnecter' });

    const decodedToken = jwt.decode(token);  
    if (!decodedToken || !decodedToken.user) return res.json({ messageError: 'Token invalide' });

    const utilisateurId = decodedToken.user;


    const response = await prisma.compteElectriciteEau.findMany({
        where:{
            utilisateurId : parseInt(utilisateurId)
        },
        include: {
            Utilisateur: true  
        },
    })

    const userAllCompte = await prisma.userManyCompteElectriciteEau.findMany({
      where: {
        AND: [
          { utilisateurId: utilisateurId },
          { valid: true }
        ]
      },
      include: {
        CompteElectriciteEau: {
          include: {
            Utilisateur: true
          }
        }, 
      },
    });

    let data = {}

    for (let index = 0; index < userAllCompte.length; index++) {
      let element = userAllCompte[index].CompteElectriciteEau;
      data[`compte_${index}`] = element;
    }

    let Data = {
      MyCompteur : {
        Data: response,
        TotalCount: response.length
      },
      OtherCompteur : {
        Data : data,
        TotalCount: userAllCompte.length
      }
    }
    

    res.status(200).json({
      message: 'Vos compteurs et les autres compteurs reliés',
      Data : Data,
      success : true
    });


    
    } catch (error) {
    res.status(500).json({ message: error.message, success: false });
    }
}




/**
 * GET COMPTE ELECTRICITE BY USER QUI ONT DES KITS
 */
export const getCompteElectriciteByUserAndKit = async(req, res) =>{
  try {
      const token = req.body.token;
  
      if (!token) return res.json({ messageError: 'Token manquant, veuillez reconnecter' });
  
      const decodedToken = jwt.decode(token);  
      if (!decodedToken || !decodedToken.user) return res.json({ messageError: 'Token invalide' });
  
      const utilisateurId = decodedToken.user;
  
  
      const response = await prisma.compteElectriciteEau.findMany({
          where:{
              AND:[
                { utilisateurId : parseInt(utilisateurId)},
                { statusDisjoncteur: true}
              ]
          },
          include: {
              Utilisateur: true
          },
      })
  
      const userAllCompte = await prisma.userManyCompteElectriciteEau.findMany({
        where: {
          AND: [
            { utilisateurId: utilisateurId },
            { valid: true }
          ]
        },
        include: {
          CompteElectriciteEau: {
            include: {
              Utilisateur: true
            }
          }, 
        },
      });
  
      let data = {}
  
      for (let index = 0; index < userAllCompte.length; index++) {
        let element = userAllCompte[index].CompteElectriciteEau;
        data[`compte_${index}`] = element;
      }
  
      let Data = {
        MyCompteur : {
          Data: response,
          TotalCount: response.length
        },
        OtherCompteur : {
          Data : data,
          TotalCount: userAllCompte.length
        }
      }
      
  
      res.status(200).json({
        message: 'Vos compteurs et les autres compteurs reliés',
        Data : Data,
        success : true
      });
  
  
      
      } catch (error) {
      res.status(500).json({ message: error.message, success: false });
      }
  }




/**
 * CREATE COMPTE ELECTRICITE EAU
 */
export const createCompteElectricite = async (req, res) => {

    const { titulaire, pseudoCompte, referenceClient, communeClient, categorie, compteurElectricite, tarif } = req.body;
    let puissance = req.body.puissance
    const {compteurEau, tarifEau} = req.body
    const type = req.body.type
    let { activite, activiteEau, redevanceEau } = ''
    let calibrage = req.body.calibrage
    let typeCompte = 'proprietaire'
    let {mois1, mois2, mois3} = req.body;
  
    const token = req.body.token;
  
    if (!token) return res.json({ messageError: 'Token manquant, veuillez reconnecter' });
  
    const decodedToken = jwt.decode(token);  
    if (!decodedToken || !decodedToken.user) return res.json({ messageError: 'Token invalide' });
  
    const utilisateurId = decodedToken.user;
  
    // puissance = convertDecimal(puissance);
  
    if(type === 'electricite'){
      if (!titulaire) return res.json({ messageError: "Veuillez ajouter le titulaire du compteur!" });
      if (!pseudoCompte) return res.json({ messageError: "Veuillez ajouter un pseudo pour votre compte!" });
      if (!referenceClient) return res.json({ messageError: "Veuillez ajouter votre référence client!" });
      if (!communeClient) return res.json({ messageError: "Veuillez séléctionner votre commune!" });
      if (!categorie) return res.json({ messageError: "Veuillez séléctionner votre catégorie!" });
      if (!compteurElectricite) return res.json({ messageError: "Veuillez ajouter le numéro de votre n° compteur d'électricité!" });
      if (!tarif) return res.json({ messageError: "Veuillez séléctionner votre tarif en électricité!" });
      if (!puissance) return res.json({ messageError: "Veuillez séléctionner la puissance de votre compteur!" });
  
      activite = 'e'
  
      const existingCompteElectriciteEau = await prisma.compteElectriciteEau.findFirst({
        where: {
            AND: [
                { referenceClient: referenceClient },
                { communeClient: parseInt(communeClient) }
            ]
        }
      });
  
      // if (existingCompteElectriciteEau) typeCompte = "invité"
      if (existingCompteElectriciteEau) return res.json({ messageError: "Ce compte existe déjà!" });
  
      const existingCompteElectriciteEauUser = await prisma.compteElectriciteEau.findFirst({
        where: {
            AND: [
                { referenceClient: referenceClient },
                { communeClient: parseInt(communeClient) },
                { utilisateurId: parseInt(utilisateurId) }
            ]
        }
      });
  
      if (existingCompteElectriciteEauUser) return res.json({ messageError: "Vous avez déjà ce compte!" });
  
  
    }else if(type === 'eau'){
      if (!titulaire) return res.json({ messageError: "Veuillez ajouter le titulaire du compteur!" });
      if (!pseudoCompte) return res.json({ messageError: "Veuillez ajouter un pseudo pour votre compte!" });
      if (!referenceClient) return res.json({ messageError: "Veuillez ajouter votre référence client!" });
      if (!communeClient) return res.json({ messageError: "Veuillez séléctionner votre commune!" });
      if (!categorie) return res.json({ messageError: "Veuillez séléctionner votre catégorie!" });
      if (!compteurEau) return res.json({ messageError: "Veuillez ajouter le numéro de votre n° compteur d'eau!" });
      if (!tarifEau) return res.json({ messageError: "Veuillez séléctionner votre tarif en eau!" });
      if (!calibrage) return res.json({ messageError: "Veuillez séléctionner la calibrage de votre compteur!" });
    
      const existingCompteElectriciteEau = await prisma.compteElectriciteEau.findFirst({
        where: {
            AND: [
                { referenceClient: referenceClient },
                { communeClient: parseInt(communeClient) }
            ]
        }
      });
  
      if (existingCompteElectriciteEau) typeCompte = "invité"
  
      const existingCompteElectriciteEauUser = await prisma.compteElectriciteEau.findFirst({
        where: {
            AND: [
                { referenceClient: referenceClient },
                { communeClient: parseInt(communeClient) },
                { utilisateurId: parseInt(utilisateurId) }
            ]
        }
      });
  
      if (existingCompteElectriciteEauUser) return res.json({ messageError: "Vous avez déjà ce compte!" });
  
      const calibrageTable = await prisma.calibrage.findFirst({
        where:{
          calibrage : parseInt(calibrage)
        }
      })
      calibrage = calibrageTable.calibrage
      redevanceEau = calibrageTable.redevance
      activiteEau = "w"
  
    }else {
  
      if (!titulaire) return res.json({ messageError: "Veuillez ajouter le titulaire du compteur!" });
      if (!pseudoCompte) return res.json({ messageError: "Veuillez ajouter un pseudo pour votre compte!" });
      if (!referenceClient) return res.json({ messageError: "Veuillez ajouter votre référence client!" });
      if (!communeClient) return res.json({ messageError: "Veuillez séléctionner votre commune!" });
      if (!categorie) return res.json({ messageError: "Veuillez séléctionner votre catégorie!" });
      if (!compteurElectricite) return res.json({ messageError: "Veuillez ajouter le numéro de votre n° compteur d'électricité!" });
      if (!tarif) return res.json({ messageError: "Veuillez séléctionner votre tarif en électricité!" });
      if (!puissance) return res.json({ messageError: "Veuillez séléctionner la puissance de votre compteur électricité!" });
      if (!compteurEau) return res.json({ messageError: "Veuillez ajouter le numéro de votre n° compteur d'eau!" });
      if (!tarifEau) return res.json({ messageError: "Veuillez séléctionner votre tarif en eau!" });
      if (!calibrage) return res.json({ messageError: "Veuillez séléctionner la calibrage de votre compteur!" });
  
      const calibrageTable = await prisma.calibrage.findFirst({
        where:{
          calibrage : parseInt(calibrage)
        }
      })
      calibrage = calibrageTable.calibrage
      redevanceEau = calibrageTable.redevance
      activiteEau = 'w'
      activite = 'e'
  
      const existingCompteElectriciteEau = await prisma.compteElectriciteEau.findFirst({
        where: {
            AND: [
                { referenceClient: referenceClient },
                { communeClient: parseInt(communeClient) }
            ]
        }
      });
      
      if (existingCompteElectriciteEau) typeCompte = "invité"
  
      const existingCompteElectriciteEauUser = await prisma.compteElectriciteEau.findFirst({
        where: {
            AND: [
                { referenceClient: referenceClient },
                { communeClient: parseInt(communeClient) },
                { utilisateurId: parseInt(utilisateurId) }
            ]
        }
      });
      if (existingCompteElectriciteEauUser) return res.json({ messageError: "Vous avez déjà ce compte!" });
  
    }
   
    if (!mois1 || mois2 || mois3) return res.json({ messageError: "Veuillez ajouter votre consommation de dernier mois!" });
  
    
    try {
      
  
        // find if client cible
        let msgClientCible = "C'est un client normal"
        let compteCibleId = null
        const ifclientCible = await prisma.compteElectriciteEauCible.findFirst({
          where:{
            referenceClient: compteurElectricite
          }
        });
        if(ifclientCible) msgClientCible = "C'est un client cible", compteCibleId = ifclientCible.id


        const isValid = /^\d{11}$/.test(referenceClient);
        if (!isValid) {
            return res.status(400).json({ error: 'Reference client invalide!' });
        }
  
        const referenceSlice = referenceClient.slice(0, 7)
        
      // console.log("tourneId: ",referenceSlice)
      // console.log("communeId: ",communeClient)
        const agence = await prisma.agence.findFirst({
          where:{
            AND:[
              {tourneId : referenceSlice},
              {communeId : parseInt(communeClient)}
            ]
          },
        })
  
        const commune = agence.commune
        // console.log("agence : ",agence)
        
        // console.log("commune : ",commune)
        
  
        const WattIntensityTension = await createWattIntensityTension (tarif, puissance)
        let puissanceWatt = WattIntensityTension.data.puissanceWatt
        let intensite = WattIntensityTension.data.intensite
        let tension = WattIntensityTension.data.tension

        const newCompte = await prisma.compteElectriciteEau.create({
          data: {
              pseudoCompte : pseudoCompte,
              titulaire : titulaire, 
              referenceClient : referenceClient,
              agence : agence.agenceCode+" "+agence.agence,
              communeClient : parseInt(communeClient),
              commune : commune,
              categorie : categorie,
              zoneId : agence.zoneId,
  
              compteurElectricite : compteurElectricite,
              tarif : tarif,
              puissance : puissance,
              activite : activite,
  
              compteurEau : compteurEau,
              tarifEau : tarifEau,
              calibrage : parseInt(calibrage),
              redevanceEau : parseFloat(redevanceEau),
              activiteEau : activiteEau,
  
              typeCompte,
              utilisateurId : parseInt(utilisateurId),
              puissanceWatt,
              intensite,
              tension,
              
              compteCibleId: compteCibleId,

              mois1: parseInt(mois1),
              mois2: parseInt(mois2),
              mois3: parseInt(mois3),
  
          }
        });

        
  
        res.json({
          messageSuccess : "Votre compte est bien ajouté",
          newCompte
        })
      
    } catch (error) {
        return res.json({ messageError: error.message });
    }
  };
  
  

/**
 * UPDATE COMPTE ELECTRICITE EAU
 */
export const updateCompteElectricite = async (req, res) => {

    let pseudoCompte = req.body.pseudoCompte;
    const id = req.body.id
    const token = req.body.token;

    if (!token) return res.status(400).json({ message: 'Token manquant, veuillez reconnecter', success: false });

    const decodedToken = jwt.decode(token);  
    if (!decodedToken || !decodedToken.user) return res.status(400).json({ message: 'Token invalide', success: false });

    const response = await prisma.compteElectriciteEau.findUnique({
        where: {
            id: parseInt(id)
        }
    })
    if (!response) return res.status(404).json({ message: `Ce compte n'existe pas`, success: false })
            
    if(!pseudoCompte) pseudoCompte = response.pseudoCompte

    const WattIntensityTension = await getWattIntensityTension(id)
    let puissanceWatt = WattIntensityTension.data.puissanceWatt
    let intensite = WattIntensityTension.data.intensite
    let tension = WattIntensityTension.data.tension

    try {
        const rep = await prisma.compteElectriciteEau.update({
            where: {
                id: parseInt(id),
            },
            data: {
                pseudoCompte,
                puissanceWatt,
                intensite,
                tension
            },
        });
        res.status(201).json({
            message : "Votre compte est bien modifié",
            Data : rep,
            success: true
        })
        
    } catch (error) {
        return res.status(500).json({ message: `Erreur lors de la création de l'expert: ${error.message}`, success: false });
    }
};
  




/**
 * DELETE COMPTE ELECTRICITE EAU
 */
export const deleteCompteElectricite = async (req, res) => {

const id = req.body.id
const token = req.body.token;

if (!token) return res.status(400).json({ message: 'Token manquant, veuillez reconnecter', success: false });

const decodedToken = jwt.decode(token);  
if (!decodedToken || !decodedToken.user) return res.status(400).json({ message: 'Token invalide', success: false });

const response = await prisma.compteElectriciteEau.findUnique({
    where: {
        id: parseInt(id)
    }
})
if (!response) return res.status(404).json({ message: `Ce compte n'existe pas`, success: false })

// trouver si le compte est rattaché à un disjoncteur
if(response.statusDisjoncteur) return res.status(403).json({ message: `Ce compte est rattaché à un disjoncteur`, success: false })

try {
    const rep = await prisma.compteElectriciteEau.delete({
        where: {
            id: parseInt(id),
        }
    });
    res.status(201).json({
        messageSuccess : "Votre compte est bien supprimé",
        updateCompte : rep,
        success: true
    })
    
} catch (error) {
    return res.status(500).json({ message: error.message, success: false });
}
};







/**
 * function get puissanceWatt, intensite, tension
 */
export async function getWattIntensityTension (compteElectriciteEauId) {
    try {

        const response = await prisma.compteElectriciteEau.findUnique({
            where:{
              id : parseInt(compteElectriciteEauId)
            },
            include: {
                Utilisateur: true
            },
        })


        let tarif = parseInt(response.tarif)
        let puissance = response.puissance
        
        
        let puissanceWatt = 0
        let intensite = 0
        let tension = 0

        if     (tarif === 10 && puissance === 1.1)  puissanceWatt = 1100 , intensite = 5
        else if(tarif === 10 && puissance === 2.2)  puissanceWatt = 2200 , intensite = 10
        else if(tarif === 20 && puissance === 3.3)  puissanceWatt = 3300 , intensite = 15
        else if(tarif === 25 && puissance === 4.4)  puissanceWatt = 4400 , intensite = 20
        else if(tarif === 25 && puissance === 5.5)  puissanceWatt = 5500 , intensite = 25
        else if(tarif === 25 && puissance === 6.6)  puissanceWatt = 6600 , intensite = 30
        else if(tarif === 40 && puissance === 7.7)  puissanceWatt = 7700 , intensite = 35
        else if(tarif === 40 && puissance === 9.9)  puissanceWatt = 9900 , intensite = 45
        else if(tarif === 40 && puissance === 11)   puissanceWatt = 11000 , intensite = 50
        else if(tarif === 40 && puissance === 12.1) puissanceWatt = 12100 , intensite = 55 
        else if(tarif === 40 && puissance === 13.2) puissanceWatt = 13200 , intensite = 60
        else if(tarif === 40 && puissance === 14.3) puissanceWatt = 14300 , intensite = 65
        else if(tarif === 40 && puissance === 15.4) puissanceWatt = 15400 , intensite = 70
        else if(tarif === 40 && puissance === 17.6) puissanceWatt = 17600 , intensite = 80
        else if(tarif === 40 && puissance === 18.7) puissanceWatt = 18700 , intensite = 85
        else if(tarif === 40 && puissance === 19.8) puissanceWatt = 19800 , intensite = 90

        return {
          message: `Valeurs puissance Watt, intensité et tension`,
          data: { puissanceWatt, intensite, tension },
          success: true
        }
  
    } catch (error) {
      return{
        message: error.message,
        success: false
      };
    }
};

export async function createWattIntensityTension (tarif, puissance) {
    try {

        tarif = parseInt(tarif)
        puissance = parseFloat(puissance)
        
        let puissanceWatt = 0
        let intensite = 0
        let tension = 0

        if     (tarif === 10 && puissance === 1.1)  puissanceWatt = 1100 , intensite = 5
        else if(tarif === 10 && puissance === 2.2)  puissanceWatt = 2200 , intensite = 10
        else if(tarif === 20 && puissance === 2.2)  puissanceWatt = 3300 , intensite = 15
        else if(tarif === 20 && puissance === 3.3)  puissanceWatt = 3300 , intensite = 15
        else if(tarif === 25 && puissance === 4.4)  puissanceWatt = 4400 , intensite = 20
        else if(tarif === 25 && puissance === 5.5)  puissanceWatt = 5500 , intensite = 25
        else if(tarif === 25 && puissance === 6.6)  puissanceWatt = 6600 , intensite = 30
        else if(tarif === 40 && puissance === 7.7)  puissanceWatt = 7700 , intensite = 35
        else if(tarif === 40 && puissance === 9.9)  puissanceWatt = 9900 , intensite = 45
        else if(tarif === 40 && puissance === 11)   puissanceWatt = 11000 , intensite = 50
        else if(tarif === 40 && puissance === 12.1) puissanceWatt = 12100 , intensite = 55 
        else if(tarif === 40 && puissance === 13.2) puissanceWatt = 13200 , intensite = 60
        else if(tarif === 40 && puissance === 14.3) puissanceWatt = 14300 , intensite = 65
        else if(tarif === 40 && puissance === 15.4) puissanceWatt = 15400 , intensite = 70
        else if(tarif === 40 && puissance === 17.6) puissanceWatt = 17600 , intensite = 80
        else if(tarif === 40 && puissance === 18.7) puissanceWatt = 18700 , intensite = 85
        else if(tarif === 40 && puissance === 19.8) puissanceWatt = 19800 , intensite = 90

        return {
          message: `Valeurs puissance Watt, intensité et tension`,
          data: { puissanceWatt, intensite, tension },
          success: true
        }
  
    } catch (error) {
      return{
        message: error.message,
        success: false
      };
    }
};




/**
 * CALCUL CONSOMMATION PAR MODE DE GESTION
 */
export async function CalculConsommationParModeGestion(compteElectriciteEauId, consommation, modeGestionId) {
  try {

    const existingCompteElectriciteEauUser = await prisma.compteElectriciteEau.findUnique({
      where: {
          id: parseInt(compteElectriciteEauId)
      }
    });
    if (!existingCompteElectriciteEauUser) return res.status(404).json({ messageError: "Ce compte n'existe pas!" });

    const modelGestionExit = await prisma.modeGestion.findUnique({
      where: {
        id: parseInt(modeGestionId)
      }
    })
    if (!modelGestionExit) return res.status(404).json({ messageError: "Ce mode de gestion n'existe pas!" });
         
   
    let min = consommation
    let zoneId = existingCompteElectriciteEauUser.zoneId
    let tarif = existingCompteElectriciteEauUser.tarif

    let kwhConsomme = min
    
    const prix = await prisma.prix.findFirst({
      where: {
        AND: [
          { zoneId: zoneId },
          { tarif: tarif }
        ]
      }
    });

    let  quantiteParTranche = {
      1 : prix.q1,
      2 : prix.q2,
      3 : prix.q3,
      4 : prix.q4
    }

    let prixParTranche = {
        1 : prix.p1,
        2 : prix.p2,
        3 : prix.p3,
        4 : prix.p4
    
    }


    let consommationParTranche = {
      1 : 0.0,
      2 : 0.0,
      3 : 0.0,
      4 : 0.0
    }

    let prixTotalParTranche = {
      1 : 0.0,
      2 : 0.0,
      3 : 0.0,
      4 : 0.0
    }
    let valid = false
    let i = 1

    while( valid === false){
      if(kwhConsomme > quantiteParTranche[i]){
        kwhConsomme = kwhConsomme - quantiteParTranche[i]
        consommationParTranche[i] = quantiteParTranche[i]
        prixTotalParTranche[i] = quantiteParTranche[i] * prixParTranche[i]
      }else{
        consommationParTranche[i] = kwhConsomme
        prixTotalParTranche[i] = kwhConsomme * prixParTranche[i]
        valid = true
      }
      i ++
    }
    let prixTotal = prixTotalParTranche[1] + prixTotalParTranche[2] + prixTotalParTranche[3] + prixTotalParTranche[4]
    let valeurEconomiser = 0
    let Msg = ""
    let tranche = 0
    
    if(modeGestionId === 1) Msg = `Nous allons vous aider à économiser votre consommation en électricité à ${modelGestionExit.pourcent}%`, valeurEconomiser = modelGestionExit.pourcent / 100, tranche = 4
    else if(modeGestionId === 2) Msg = `Votre consommation en électricité est normale`, valeurEconomiser = 1, tranche = 3
    else if(modeGestionId === 3) Msg = `Votre consommation en électricité augmente de ${modelGestionExit.pourcent}%`, valeurEconomiser = modelGestionExit.pourcent / 100, tranche = 2

    // let valeur = consommationParTranche[tranche]
    // let reduction = (valeur * valeurEconomiser).toFixed(2)
    
    let kwhConsommeNew = min
    let reduction = (kwhConsommeNew * valeurEconomiser).toFixed(2)
    if(modeGestionId === 1) kwhConsommeNew = parseFloat(kwhConsommeNew) - parseFloat(reduction)
    if(modeGestionId === 2) kwhConsommeNew = parseFloat(kwhConsommeNew) 
    if(modeGestionId === 3) kwhConsommeNew = parseFloat(kwhConsommeNew) + parseFloat(reduction)

      
    let trancheConsommationNormal = {
      1 : 0.0,
      2 : 0.0,
      3 : 0.0,
      4 : 0.0
    }
    i = 1
    valid = false
    while( valid === false){
      if(kwhConsommeNew > quantiteParTranche[i]){
        kwhConsommeNew = kwhConsommeNew - quantiteParTranche[i]
        trancheConsommationNormal[i] = quantiteParTranche[i]
      }else{
        trancheConsommationNormal[i] = kwhConsommeNew
        valid = true
      }
      i ++
    }

    // for (let index = 1; index <= tranche; index++) {
    //   if(index === tranche){
    //     trancheConsommationNormal[index] = parseFloat(reduction)
    //   }else{
    //     trancheConsommationNormal[index] = consommationParTranche[index]
    //   }
    // }

    

    let consommationNormal = trancheConsommationNormal[1] + trancheConsommationNormal[2] + trancheConsommationNormal[3] + trancheConsommationNormal[4]
    let consommationJour = (consommationNormal / 30).toFixed(2)
    let consommationHeure = (consommationJour / 24).toFixed(2)

    
    // calculer le prix normal par tranche
    let prixNormalTotalParTranche = {
      1 : trancheConsommationNormal[1] * prixParTranche[1],
      2 : trancheConsommationNormal[2] * prixParTranche[2],
      3 : trancheConsommationNormal[3] * prixParTranche[3],
      4 : trancheConsommationNormal[4] * prixParTranche[4]
    }
    let prixNormalTotal = prixNormalTotalParTranche[1] + prixNormalTotalParTranche[2] + prixNormalTotalParTranche[3] + prixNormalTotalParTranche[4]

    
    // calculer en TTC la consommation normale
    let prixTotalTTC = await CalculTKwhEnAriaryTTC(compteElectriciteEauId, min)
    if (prixTotalTTC.messageError) return res.status(400).json({ messageError: resultElectricite.messageError }); 


    // calculer en TTC la consommation normale
    let prixTTC = await CalculTKwhEnAriaryTTC(compteElectriciteEauId, consommationNormal)
    if (prixTTC.messageError) return res.status(400).json({ messageError: resultElectricite.messageError }); 

    


    let data = {
      Msg: Msg,
      min: min,
      consommationParTranche : consommationParTranche,
      prixTotalParTranche: prixTotalParTranche,
      prixTotal: prixTotal,
      prixTotalTTC: prixTotalTTC.data.prixTTC,
      valeurEconomiser : valeurEconomiser * 100,
      tranche: tranche,
      reduction: reduction,
      consommationNormal: consommationNormal,
      trancheConsommationNormal: trancheConsommationNormal,
      prixNormalTotalParTranche: prixNormalTotalParTranche,
      prixNormalTotal: prixNormalTotal,
      consommationJour: parseFloat(consommationJour),
      consommationHeure: parseFloat(consommationHeure),
      prixTTC: prixTTC.data.prixTTC
    }

    // console.log("data : ",data)
     return {data : data}

  } catch (error) {
    return { messageError: error.message };
  }
  
}