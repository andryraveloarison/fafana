import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()



/**
 * COMPTE ELECTRICITE EAU CIBLE
 */
export const getAllCompteElectriciteEauCible = async(req, res) =>{
  try {
      const response = await prisma.compteElectriciteEauCible.findMany({
        orderBy: {
          id:'asc',
        },
      })
      res.status(200).json({
        message: "Listes de vos comptes électricité et eau cible",
        Data: response,
        success: true
      })
     
    } catch (error) {
      res.status(500).json({ message: error.message, success: false });
    }
}





/**
 * CODE AGENCE
 */
export const getAllAgence = async(req, res) =>{
  try {
      const response = await prisma.agence.findMany({
        orderBy: {
          id:'asc',
        }
      })
      res.json(response)
     
    } catch (error) {
      res.status(500).json({ messageError: 'Erreur serveur' });
    }
}


export const getAgenceByTourne = async(req, res) =>{
    try {
        const tourneId = req.body.tourneId

        const isValid = /^\d{11}$/.test(tourneId);
        if (!isValid) {
            return res.status(400).json({ error: 'Reference client invalide!', success: false });
        }

        const tourneSlice = tourneId.slice(0, 7)

        const response = await prisma.agence.findMany({
            where:{
              tourneId : tourneSlice
            },
        })

        if (!response) return res.json({ messageError: "Réference introuvable", success: false });

  
        // find reference in table CompteElectriciteEau
        const CompteElectriciteEauExist = await prisma.compteElectriciteEau.findFirst({
          where:{
            referenceClient : tourneId
          },
          include: {
            Utilisateur: true
          }
        })
        if(CompteElectriciteEauExist) return res.json({ message: "Ce référence est déjà utilisée par un compte électricité électrique", Data: CompteElectriciteEauExist,  success: true });


        res.json(response)
       
      } catch (error) {
        res.status(500).json({ messageError: error.message, success: false });
      }
}


export const getAgenceByCommune = async(req, res) =>{
  try {
      const communeId = req.body.communeId

      const response = await prisma.agence.findMany({
          where:{
            communeId : parseInt(communeId)
          },
      })

      if (!response) return res.json({ messageError: "Réference introuvable" });

      res.json(response)
     
    } catch (error) {
      res.status(500).json({ messageError: 'Erreur serveur' });
    }
}

export const getAgenceByTourneAndCommune = async(req, res) =>{
  try {
      const communeId = req.body.communeId
      const tourneId = req.body.tourneId

      const isValid = /^\d{11}$/.test(tourneId);
        if (!isValid) {
            return res.status(400).json({ error: 'Reference client invalide!' });
        }

      const tourneSlice = tourneId.slice(0, 7)

      const response = await prisma.agence.findFirst({
          where:{
            AND:[
              {tourneId : parseInt(tourneSlice)},
              {communeId : parseInt(communeId)}
            ]
          },
      })

      if (!response) return res.json({ messageError: "Réference introuvable" });

      // const response = await prisma.prix.findFirst({
      //   where: {
      //     AND: [
      //       { zoneId: zoneId },
      //       { tarif: tarif }
      //     ]
      //   }
      // });
      res.json(response)
     
    } catch (error) {
      res.status(500).json({ messageError: 'Erreur serveur' });
    }
}






/**
 * CODE FNE
 */
export const getAllFne = async(req, res) =>{
  try {
      const response = await prisma.fne.findMany({
        orderBy: {
          id:'asc',
        },
      })
      res.json(response)
     
    } catch (error) {
      res.status(500).json({ messageError: 'Erreur serveur' });
    }
}


export const getFneByTarif = async(req, res) =>{
    try {
        const tarif = req.body.tarif

        const response = await prisma.fne.findUnique({
            where:{
              tarif : tarif
            }
        })
        res.json(response)
       
      } catch (error) {
        res.status(500).json({ messageError: 'Erreur serveur' });
      }
}





/**
 * CODE PRIX
 */
export const getAllPrix = async(req, res) =>{
  try {
      const response = await prisma.prix.findMany({
        orderBy: {
          id:'asc',
        },
      })
      res.json(response)
     
    } catch (error) {
      res.status(500).json({ messageError: 'Erreur serveur' });
    }
}



export const getPrixByZoneAndTarif = async (req, res) => {
  try {
    const { zoneId, tarif } = req.body;

    if (!zoneId || !tarif) {
      return res.status(400).json({ messageError: "Veuillez fournir zoneId et tarif!" });
    }

    const response = await prisma.prix.findFirst({
      where: {
        AND: [
          { zoneId: zoneId },
          { tarif: tarif }
        ]
      }
    });

    if (response.length === 0) {
      return res.status(404).json({ messageError: "Aucun résultat trouvé pour les critères spécifiés." });
    }

    res.json(response);
  } catch (error) {
    console.error('Erreur serveur:', error);
    res.status(500).json({ messageError: 'Erreur serveur' });
  }
};






/**
 * CODE TAXE
 */
export const getAllTaxe = async(req, res) =>{
  try {
      const response = await prisma.taxe.findMany({
        orderBy: {
          id:'asc',
        },
      })
      res.json(response)
     
    } catch (error) {
      res.status(500).json({ messageError: 'Erreur serveur' });
    }
}


export const getTaxeByTarifCommuneActivite = async(req, res) =>{
    try {
        const site = req.body.site
        const activite = req.body.activite
        const communeId = req.body.communeId

        console.log("site: ",site);
        console.log("communeId : ",communeId);
        console.log("activite : ",activite);

        const response = await prisma.taxe.findFirst({
          where: {
            AND: [
              { site: site },
              { communeId: communeId },
              { activite: activite }
            ]
          }
        })
        res.json(response)
       
      } catch (error) {
        res.status(500).json({ messageError: 'Erreur serveur' });
      }
}





/**
 * CODE TARIF
 */
export const getAllTarif = async(req, res) =>{
  try {
      const response = await prisma.tarif.findMany({
        orderBy: {
          id:'asc',
        },
      })
      res.json(response)
     
    } catch (error) {
      res.status(500).json({ messageError: 'Erreur serveur' });
    }
}


export const getTarifById = async(req, res) =>{
    try {
        const idTarif = req.body.idTarif

        const response = await prisma.tarif.findUnique({
            where:{
                id : parseInt(idTarif)
            }
        })
        res.json(response)
       
      } catch (error) {
        res.status(500).json({ messageError: 'Erreur serveur' });
      }
}


export const getTarifByTarif = async(req, res) =>{
  try {
      const tarif = req.body.tarif

      const response = await prisma.tarif.findUnique({
          where:{
            tarif : tarif
          }
      })
      res.json(response)
     
    } catch (error) {
      res.status(500).json({ messageError: 'Erreur serveur' });
    }
}



export const createCodeTarif = async(req, res) =>{
    // try {
    //     const tarif = req.body.tarif;
    //     const nom = req.body.nom;
    //     const token = req.body.token;

    //     if (!token) {
    //         return res.json({ messageError: 'Token manquant, veuillez reconnecter' });
    //         }
    //     const decodedToken = jwt.decode(token);  
    //     if (!decodedToken || !decodedToken.user) {
    //         return res.json({ messageError: 'Token invalide' });
    //     }
    
    //     if (!tarif) return res.json({ messageError: "Veuillez ajouter le tarif" });
    //     if (!nom) return res.json({ messageError: "Veuillez ajouter le nom du tarif" });

    //     const newTarif = await CodeTarif.create({tarif, nom});
    //     res.status(201).json({ tarif: newTarif });
       
    //   } catch (error) {
    //     res.status(500).json({ messageError: 'Erreur serveur' });
    //   }
}


export const updateCodeTarif = async(req, res) =>{
    // try {

    //     const idCodeTarif = req.body.idCodeTarif
    //     const codetarif = await CodeTarif.findOne({
    //         where:{
    //             id: idCodeTarif
    //         }
    //     })

    //     if(!codetarif) return res.json({messageError: "Introuvable!"})
    //     const tarif = req.body.tarif;
    //     const nom = req.body.nom;
    //     const token = req.body.token;

    //     if (!tarif) return res.json({ messageError: "Veuillez ajouter le tarif" });
    //     if (!nom) return res.json({ messageError: "Veuillez ajouter le nom du tarif" });

    //     if (!token) return res.json({ messageError: 'Token manquant, veuillez reconnecter' });
    //     const decodedToken = jwt.decode(token);  
    //     if (!decodedToken || !decodedToken.user) return res.json({ messageError: 'Token invalide' });
        
        
     
    //     await CodeTarif.update({tarif, nom},{
    //         where:{
    //             id: idCodeTourne
    //         }
    //     });
    //     res.json({messageSucces:"Modification a été effectué avec succès"})
        
       
    //   } catch (error) {
    //     res.status(500).json({ messageError: 'Erreur serveur' });
    //   }
}