import { PrismaClient } from '@prisma/client'


const prisma = new PrismaClient()

export const getAllProvince = async(req, res) =>{
  try {

      const response = await prisma.province.findMany()
      res.json(response)
     
    } catch (error) {
      res.status(500).json({ messageError: 'Erreur serveur' });
    }
}



export const createProvince = async(req, res) =>{
    try {
        const province = req.body.nom;
        const provinceLowercase = province.toLowerCase();

        const provinceExit = await prisma.province.findUnique({
          where:{
            nom: provinceLowercase
          }
        })
        
        if(provinceExit){
          res.status(500).json({ error: 'Cette province existe déjà' });
        }else{
          const newProvince = await prisma.province.create({
            data:{
              nom: provinceLowercase
            }})
          
          res.status(200).json({ province: newProvince });
        }
      } catch (error) {
        res.status(500).json({ messageError: 'Erreur serveur' });
      }
}