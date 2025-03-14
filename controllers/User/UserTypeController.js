import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const getAllTypeUser = async(req, res) =>{
  try {

      const response = await prisma.typeUser.findMany()
      res.json(response)
     
    } catch (error) {
      res.status(500).json({ messageError: 'Erreur serveur' });
    }
}

export const getTypeUserById = async(req, res) => {
  try {
    const idTypeUser = req.body.idTypeUser
      
      const response = await prisma.typeUser.findUnique({
          where: {
              id: parseInt(idTypeUser),
          }
      });

      if (!response) {
          return res.status(404).json({ messageError: "Type not found" });
      }
      res.json(response)
  } catch (error) {
      
  }
}


export const createTypeUser = async(req, res) =>{
    try {
        const type = req.body.type;
        const typeLowercase = type.toLowerCase();

        const userTypeExit = await prisma.typeUser.findUnique({
          where:{
            type: typeLowercase
          }
        })
        if(userTypeExit){
          res.status(500).json({ error: 'Cette type d\'utilisateur existe déjà' });
        }else{
          const newUserType = await prisma.typeUser.create({
            data: {
              type: typeLowercase
            }
          });
          res.status(201).json({ userType: newUserType });
        }
       
      } catch (error) {
        console.error('Erreur', error);
        res.status(500).json({ messageError: 'Erreur serveur' });
      }
}



export const updateTypeUserAllUser = async(req, res) =>{
  try {
      // get all user gratuit and premium
      let allUser = await prisma.utilisateur.findMany({
        where: {
          OR: [
            {typeUserId: 1},
            {typeUserId: 2}
          ]
        }
      });

      for (let index = 0; index < allUser.length; index++) {
        let typeUserId = allUser[index].typeUserId;
        let id = allUser[index].id;

        // find if user have disjoncteur
        const userTypeExit = await prisma.kitTongouUser.findMany({
          where: {
            utilisateurId: id
          }
        })
        if(userTypeExit.length === 0){
          // update user in gratuit
          await prisma.utilisateur.update({
            where: {
              id: id
            },
            data: {
              typeUserId: 1
            }
          })
        }else{
          // update user in premium
          await prisma.utilisateur.update({
            where: {
              id: id
            },
            data: {
              typeUserId: 2
            }
          })
        }
      }

      allUser = await prisma.utilisateur.findMany({
        include: {
          TypeUser: true,
          Zone: true
        },
        orderBy: {
          id: 'asc'
        },
      });

    
      res.status(201).json({ 
        message: "Tout les types utilisateurs sont à jour" ,
        Data: allUser,
        success: true
      });
    } catch (error) {
      res.status(500).json({ message: error.message, success: false });
    }
}