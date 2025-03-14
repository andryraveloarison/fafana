import jwt from "jsonwebtoken";
import { PrismaClient } from '@prisma/client'
import axios from 'axios'

const prisma = new PrismaClient()
const portAppareil = process.env.PORT_APPAREIL

export const getAllKitTongouGroupe = async(req, res) =>{
  try {
      const response = await prisma.kitGroupeTongou.findMany({
        orderBy: {
            id:'desc',
        },
        include: {
            Utilisateur: true
        },
      })
      res.status(200).json({
        Msg: "Listes des groupes du kits tongou",
        TotalCount: response.length,
        Data: response
      })
     
    } catch (error) {
      res.status(500).json({ message:error.message, success: false });
    }
}


export const getKitTongouGroupeByUser = async(req, res) =>{
    try {
        const utilisateurId = req.body.utilisateurId

        const response = await prisma.kitGroupeTongou.findMany({
            where:{
                OR: [
                    { utilisateurId: parseInt(utilisateurId) },
                    { status : "default" }
                ]
            },
            orderBy:{
                id:"asc"
            }
        })

        // trouver si l'utilisateur à une compte externe
        let compteExterne = await prisma.kitTongouManyUser.findMany({
            where: {
              AND: [
                { utilisateurId: parseInt(utilisateurId)},
                { valid: true }
              ]
            },
        })

        
        
        if(compteExterne.length > 0){
            for (let index = 0; index < compteExterne.length; index++) {
                let kitTongouId = compteExterne[index].kitTongouId
                // trouver le kit tongou
                const kitTongou = await prisma.kitTongou.findUnique({
                    where: {
                        id: kitTongouId
                    },
                    include: {
                        KitGroupeTongou: true
                    }
                })
                
                const filteredResponse = response.filter(item => item.id === kitTongou.KitGroupeTongou.id);
                
                
                if(filteredResponse.length === 0){
                    let status = "externe";
                    if(kitTongou.kitTypeId === 3) status = "hybride"
                    response.push({
                        id: kitTongou.KitGroupeTongou.id,
                        groupe: kitTongou.KitGroupeTongou.groupe,
                        utilisateurId: kitTongou.KitGroupeTongou.utilisateurId,
                        status: status
                    })
                }

            }

           
        }



        // const response = await prisma.kitGroupeTongou.findMany({
        //     where:{
        //         AND: [
        //             { utilisateurId: parseInt(utilisateurId) },
        //             { status : "customer" }
        //         ]
        //     },
        //     orderBy:{
        //         id:"asc"
        //     }
        // })

        res.status(200).json({
            Msg: "Listes des groupes de vos kits",
            TotalCount: response.length,
            Data: response
          })
       
    } catch (error) {
        console.error("Erreur lors de la recuperation des groupes de vos kits :", error);
    res.status(500).json({ message:error.message, success: false });
    }
}



export const createKitTongouGroupe = async(req, res) =>{
    try {
        let { groupe, utilisateurId } = req.body
        let status = "default"
        if (utilisateurId) {  
            status = "customer"  

            const kitTongouUserExist = await prisma.kitTongouUser.findMany({
                where: {
                    utilisateurId : parseInt(utilisateurId)
                }
            });
            if(kitTongouUserExist.length === 0) return res.status(403).json({ message: 'Vous devez avoir au moins un appareil avant de créer un groupe!', success: false })
     
        }
            
        const typeExit1 = await prisma.kitGroupeTongou.findFirst({
            where: {
                AND: [
                    { groupe : groupe.toLowerCase() },
                    { status: "default" }
                ]
            }
        });
        if (typeExit1) return res.status(403).json({ message: 'Ce groupe est déjà dans les listes par défaut!', success: false });

        const typeExit2 = await prisma.kitGroupeTongou.findFirst({
            where: {
                AND: [
                    { groupe : groupe.toLowerCase() },
                    { utilisateurId: parseInt(utilisateurId) }
                ]
            }
        });
        if (typeExit2) return res.status(403).json({ message: 'Ce groupe existe déjà!', success: false });


        const newGroupe = await prisma.kitGroupeTongou.create({
            data: {
                groupe : groupe.toLowerCase(), 
                utilisateurId : parseInt(utilisateurId),
                status : status
            }
        });

        res.status(201).json({ 
            Msg: "Votre groupe est bien crée avec succès",
            Data: newGroupe,
            success: true
         });
       
      } catch (error) {
        res.status(500).json({ message:error.message, success: false });
      }
}


export const updateNameKitTongouGroupe = async(req, res) =>{
    try {
        let { KitGroupeTongouId, utilisateurId, groupe } = req.body
        
        if(!KitGroupeTongouId || !utilisateurId || !groupe) return res.status(400).json({ message: "Les champs 'groupe', 'KitGroupeTongouId' et 'utilisateurId' sont obligatoires.", success: false });

        const response = await prisma.kitGroupeTongou.findFirst({
            where:{
                id: parseInt(KitGroupeTongouId)
            }
        })
        if(!response) return res.status(400).json({ message: "Ce groupe n'existe pas!", success: false })
        if(response.status === 'default') return res.status(400).json({ message: "Vous ne pouvez pas modifier le groupe par défault.", success: false })

        const typeExit1 = await prisma.kitGroupeTongou.findFirst({
            where: {
                AND: [
                    { groupe : groupe.toLowerCase() },
                    { status: "default" }
                ]
            }
        });
        if (typeExit1) return res.status(403).json({ message: 'Ce groupe est déjà dans les listes par défaut!', success: false });

        const typeExit2 = await prisma.kitGroupeTongou.findFirst({
            where: {
                AND: [
                    { groupe : groupe.toLowerCase() },
                    { utilisateurId: parseInt(utilisateurId) }
                ]
            }
        });
        if (typeExit2) return res.status(403).json({ message: 'Ce groupe existe déjà!', success: false });



        // update groupe kit
        const updatedKit = await prisma.kitGroupeTongou.update({
            where: {
                id: parseInt(KitGroupeTongouId)
            },
            data: {
                groupe : groupe.toLowerCase()
            }
        });

        res.status(201).json({ 
            Msg: "Votre groupe est bien modifié avec succès",
            Data: updatedKit,
            success: true
        });  
        
    } catch (error) {
    res.status(500).json({ message:error.message, success: false });
    }
}




export const updateGroupeInKit = async(req, res) =>{
    try {
        // find all kitTongou
        const kitTongou = await prisma.kitTongou.findMany()

        for (let index = 0; index < kitTongou.length; index++) {
            let id = kitTongou[index].id
            let KitGroupeTongouId = 1

            // update kitTongou 
            await prisma.kitTongou.update({
                where: {
                    id: id
                },
                data: {
                    KitGroupeTongouId: KitGroupeTongouId
                }
            })
            
        }

        const kitTongouUpdate = await prisma.kitTongou.findMany()

        res.status(201).json({ 
            Msg: "Tout les kits sont bien mis à jour avec succès",
            Data: kitTongouUpdate,
            success: true
         });
       
      } catch (error) {
        res.status(500).json({ message:error.message, success: false });
      }
}