import { PrismaClient } from '@prisma/client'


const prisma = new PrismaClient()


export const getAllZone = async(req, res) =>{
  try {

      const response = await prisma.zone.findMany()
      res.json(response)
     
    } catch (error) {
      res.status(500).json({ messageError: 'Erreur serveur' });
    }
}


export const getZoneByProvince = async (req, res) => {
  try {
    const provinceId = req.body.provinceId;

    if (!provinceId) {
      return res.json({ messageError: 'Province ID is required' });
    }

    const zones = await prisma.zone.findMany({
      where: {
        provinceId: parseInt(provinceId),
      },
    });

    if (zones.length === 0) {
      return res.status(204).json({ messageError: "Cette province n'est pas encore disponible" });
    }

    res.json(zones);
  } catch (error) {
    console.error(error);
    res.status(500).json({ messageError: 'Server error' });
  }
}


export const createZone = async(req, res) =>{
    try {
        const zone = req.body.nom;
        const provinceId = req.body.provinceId;
        const zoneLowercase = zone.toLowerCase();

       

        const zoneExit = await prisma.zone.findUnique({
          where:{
            nom: zoneLowercase
          }
        })
        

        if(zoneExit){
          res.status(500).json({ error: 'Cette zone existe déjà' });
        }else{
            const dataNewUser={
              nom: zone, 
              provinceId: provinceId
            }

        
          const newZone = await prisma.zone.create({
            data: dataNewUser
          });
          res.status(201).json({ zone: newZone });
        }
       
      } catch (error) {
        res.status(500).json({ messageError: 'Erreur serveur' });
      }
}