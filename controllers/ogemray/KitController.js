import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv';
import axios from 'axios'
import axiosRetry from 'axios-retry'

config();

const prisma = new PrismaClient()
const portAppareil = process.env.PORT_APPAREIL
const API_KIT = process.env.API_KIT;
const port_ecozipo = process.env.PORT_ECOZIPO;
let cachedToken = null;
let tokenExpiration = null;
axiosRetry(axios, { retries: 3 });

/**
 *
 *  GET KIT IN SERVER CHINE
 *
 */
export const getAllKitChine = async (req, res) => {
  try {
   
    const response = await axios.get('http://localhost:5000/gettokenbykit');
    const token = response.data.token;
    const apiUrl = `${API_KIT}/api/Device/list?token=${token}`;
    const dataList = await axios.get(apiUrl);


    res.status(201).json({
      data: dataList.data
    });

  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la récupération du token",
      error: error.message
    });
  }
};


/**
 *
 *  GET KIT IN OUR SERVER
 *
 */


/**
 *  Allume automatiquement les kits
 */
export async function allumeAutomatiquementKit() {
  try {

    const response = await prisma.kit.findMany({
      where:{
        status: true
      },
      include:{
        KitType: true
      }
    })

    // console.log("response : ",response)

    if (!cachedToken || tokenExpiration <= Date.now()) {
      const gettoken = await axios.get(`${port_ecozipo}/gettokenbykit`);
      cachedToken = gettoken.data.token;
      tokenExpiration = Date.now() + (2 * 60 * 60 * 1000);
    }

    let token = cachedToken;
    let apiUrl = `${API_KIT}/api/device/controls`


    for (let index = 0; index < response.length; index++) {
      let statusMain = response[index].statusMain
      let DID = response[index].DID
      let idKit = response[index].id

      let controlData = {
        Token: token,
        DID: parseInt(DID),
        ControlCode: "SwitchStatusQuery",
        ControlParam: null,
      };
  
      let statusKit = await axios.post(apiUrl, controlData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // console.log("statusKit : ",statusKit.data.Data);
      // update status power kit
     
      let KitOnorOff = statusKit.data.Data.SwitchArray[0]
      let kitStatus = false
      if(KitOnorOff === 0) kitStatus = false
      else kitStatus = true
      await prisma.kit.update({
        where: { id: idKit },
        data: {
          kitStatus : kitStatus
        },
      });

      if(kitStatus === statusMain){
        try { 

          rep = await axios.post(`${port_ecozipo}/kitonoroff`, {DID : DID.toString(), status : 1});     
        } catch (error) { 
          return res.status(500).json({ messageError: "Verifiéo ny kit"}); 
        }
      }
    }

  } catch (err) {
      // console.error("Vous êtez hors ligne, Veuillez vérifier votre connexion!");
  }
}



export const getAllKit= async(req, res) =>{
  try {
    const response = await prisma.kit.findMany({
      orderBy: {
          id:'asc',
      },
      include:{
        KitType: true
      }
    })
    res.json({
      Msg : "Liste des kits",
      TotalCount : response.length,
      Data : response
    })
   
  } catch (error) {
    res.status(500).json({ messageError: 'Erreur serveur' });
  }
}



/**
 * GET KIT BY ID
 */
export const getKitById = async(req, res) =>{
    try {
        const idAppareil = req.body.idAppareil;

        const response = await axios.post(`${portAppareil}/getappareilbyid`, {idAppareil});

        res.json(response.data)
       
      } catch (error) {
        res.status(500).json({ messageError: 'Erreur serveur' });
      }
}


/**
 * CREATE KIT
 */
export const createKit = async(req, res) =>{
    try {
        const DID = req.body.DID;
        const kitTypeId = req.body.kitTypeId;
        if(!DID) return res.status(400).json({ messageError: 'DID is required' })

        const findKit = await axios.get('http://localhost:5000/getallkitchine');


        let valid = false
        let { DMac, Name, DeviceType, DeviceTypeName, DeviceModel } = ''

        for (let index = 0; index < findKit.data.data.Data.TotalCount; index++) {
          if(parseInt(DID) === findKit.data.data.Data.Devices[index].DID) {
            DMac = findKit.data.data.Data.Devices[index].DMac
            Name = findKit.data.data.Data.Devices[index].Name
            DeviceType = findKit.data.data.Data.Devices[index].DeviceType
            DeviceTypeName = findKit.data.data.Data.Devices[index].DeviceTypeName
            DeviceModel = findKit.data.data.Data.Devices[index].DeviceModel
            valid = true
          }
        }
        if(!valid) return res.status(400).json({ messageError: 'DID non valide' })

        const DIDIExit = await prisma.kit.findFirst({
          where: {
            DID : parseInt(DID),
          }
        });
        if(DIDIExit) return res.status(400).json({ messageError: 'DID existe déjà' })
        
        const newKit = await prisma.kit.create({
          data: {
              DID : parseInt(DID),
              DMac : DMac,
              Name : Name,
              DeviceType : DeviceType,
              DeviceTypeName : DeviceTypeName,
              DeviceModel : DeviceModel,
              kitTypeId: parseInt(kitTypeId)
          }
        });

        res.status(201).json({
            message: "Kit created",
            data: newKit
        });
       
      } catch (error) {
        res.status(500).json({ messageError: 'Erreur serveur' });
      }
}



/**
 * UPDATE NAME KIT
 */
export const updateNameKit = async(req, res) =>{
  try {
      const DID = req.body.DID;
      const name = req.body.name

      if(!DID) return res.status(400).json({ messageError: 'DID is required' })
      if(!name) return res.status(400).json({ messageError: 'Name is required'})

      const findKit = await axios.get('http://localhost:5000/getallkitchine');

      let valid = false

      for (let index = 0; index < findKit.data.data.Data.TotalCount; index++) {
        if(parseInt(DID) === findKit.data.data.Data.Devices[index].DID) valid = true
      }
      if(!valid) return res.status(400).json({ messageError: 'DID non valide' })

      const kit = await prisma.kit.findFirst({
        where: { DID : parseInt(DID)}
      })

      const updateKit = await prisma.kit.update({
        where: { id : kit.id },
        data: {
          Name : name
        }
      });
      

      res.status(201).json({
          message: "Le nom du kit est bien modifié",
          data: updateKit
      });
     
    } catch (error) {
      res.status(500).json({ messageError: 'Erreur serveur' });
    }
}


export const reinitialiserStatusNotifKit = async (req, res) => {
  try {
    
    // UPDATE KIT STATUS
    const kit = await prisma.kit.findMany()
    for (let index = 0; index < kit.length; index++) {
      await prisma.kit.update({
        where: { id: kit[index].id },
        data: {
          status1 : false,
          status2 : false,
          status3 : false,
          status4 : false
        }
      });
    }

    res.json({ 
      Msg: "Toutes les notifications du kits sont réinitialisées",
      data:[]
     });
  } catch (error) {
    res.status(500).json({ messageError: 'Erreur serveur' });
  }
};


export const deleteUserKit_Kit_Historique_KitNotifStatus = async (req, res) => {
  try {
    // UserAppareil
    await prisma.userAppareil.deleteMany({});
    await prisma.$executeRaw`ALTER SEQUENCE "UserAppareil_id_seq" RESTART WITH 1;`;


    // UPDATE KIT STATUS
    const kit = await prisma.kit.findMany()
    for (let index = 0; index < kit.length; index++) {
      await prisma.kit.update({
        where: { id: kit[index].id },
        data: {
          status : false,
          consommationMin: null,
          tranche: null,
          pourcentageTranche: null,
          consommationBut: null,
          consommationJour: null,
          consommationHeure: null
        }
      });
    }

    // DELETE NOTIFICATION
    await prisma.notification.deleteMany({});
    await prisma.$executeRaw`ALTER SEQUENCE "Notification_id_seq" RESTART WITH 1;`;


    // DELETE KitNotifStatus
    await prisma.kitNotifStatus.deleteMany({});
    await prisma.$executeRaw`ALTER SEQUENCE "kitNotifStatus_id_seq" RESTART WITH 1;`;


    res.json({ 
      messageSucces: "Toutes les données ont été supprimées et l'ID a été réinitialisé",
      table : "UserAppareil, kitNotifStatus, Notification"
     });
  } catch (error) {
    res.status(500).json({ messageError: 'Erreur serveur' });
  }
};