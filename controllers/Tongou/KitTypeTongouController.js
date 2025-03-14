import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const getAllKitTypeTongou = async(req, res) =>{
  try {
      const response = await prisma.kitTypeTongou.findMany({
        orderBy: {
          id:'asc',
        }
      })
      res.status(200).json({
        message: "Liste des kits EcoZipo",
        Data: response,
        totalCount: response.length,
        success: true
      
      })
     
    } catch (error) {
      console.error(`Erreur lors du récuperation des kits EcoZipo ${error.message}`, error);
      res.status(500).json({ message: error.message, success: false });
    }
}


export const getKitTypeTongouById = async(req, res) =>{
    try {
        const kitTypeTongouId = req.body.kitTypeTongouId

        // find if kit type exist
        const kitTypeTongou = await prisma.kitTypeTongou.findUnique({
          where: {
            id: parseInt(kitTypeTongouId)
          }
        });
        if(!kitTypeTongou) return res.status(404).json({ message: "Ce kit n'existe pas", success: false })
        
            res.status(200).json({
            message: `Kit ${kitTypeTongou.marque} ${kitTypeTongou.model}`,
            Data: kitTypeTongou,
            success: true
            
        })
       
      } catch (error) {
        console.error(`Erreur lors du récuperation des kits EcoZipo ${error.message}`, error);
        res.status(500).json({ message: error.message, success: false });
      }
}


export const addKitTypeTongou = async (req, res) => {
    const { marque, description, model, quantity, prix, image, url } = req.body;
    if (!marque || !description || !model  || !image || !url) return res.status(400).json({ message: "Les champs 'marque', 'description', 'model', 'quantity', 'prix', 'image' et 'url' sont obligatoires.", success: false });

   
    try {
        // find if kit type exist
        const kitTypeTongouExist = await prisma.kitTypeTongou.findFirst({
          where: {
            AND: [
              { marque: marque },
              { model: model }
            ]
          } 
        });
        if(kitTypeTongouExist) return res.status(403).json({ message: "Ce type de kit existe déjà", success: false });
    
        const addKitType = await prisma.kitTypeTongou.create({
            data: {
                marque,
                description,
                model,
                quantity : parseFloat(quantity),
                prix: parseInt(prix),
                image,
                url,
            }
        });

        res.status(201).json({
            message: `Le type de kit ${addKitType.marque} a été bien ajouté avec succès`,
            Data: addKitType,
            success: true
        });

    } catch (error) {
        console.error(`Erreur lors d'ajout du type de kit ${error.message}`, error);
        res.status(500).json({ message: error.message, success: false });
    }
};


export const updateKitTypeTongou = async (req, res) => {
    try {
    const kitTypeTongouId = req.body.kitTypeTongouId
    const { marque, description, model, quantity, prix, image, url } = req.body;

    // find if kit type exist
    const kitTypeTongou = await prisma.kitTypeTongou.findUnique({
        where: {
        id: parseInt(kitTypeTongouId)
        }
    });
    if(!kitTypeTongou) return res.status(404).json({ message: "Ce kit n'existe pas", success: false })
        
    
    const updateKitTypeTongou = await prisma.kitTypeTongou.update({
        where: { id: parseInt(kitTypeTongouId) },
        data: {
            marque: marque || kitTypeTongou.marque,
            description: description || kitTypeTongou.description,
            model: model || kitTypeTongou.model,
            quantity : parseFloat(quantity) || kitTypeTongou.quantity,
            prix: parseInt(prix) || kitTypeTongou.prix,
            image: image || kitTypeTongou.image,
            url: url || kitTypeTongou.url,
        }
    });

    res.status(201).json({
        message: `Le type de kit ${updateKitTypeTongou.marque} a été bien mis à jour`,
        Data: updateKitTypeTongou,
        success: true
    });

    } catch (error) {
        console.error(`Erreur lors du modification du type de kit ${error.message}`, error);
        res.status(500).json({ message: error.message, success: false });
    }
};