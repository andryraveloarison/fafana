import dotenv from 'dotenv';
import axios from 'axios';
import { execFile } from "child_process";
import { fileURLToPath } from 'url';
import path from 'path';
import { platform } from "os";
import { PrismaClient } from '@prisma/client'
import { functionGetStatusKitTongou } from './KitTongouController.js';

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const port_ecozipo = process.env.PORT_ECOZIPO;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '../..');
const prisma = new PrismaClient()

let pythonPath = ""
if (platform() === "win32") {
  // Pour Windows
  pythonPath = path.join(projectRoot, 'env', 'Scripts', 'python.exe');
} else {
  // Pour Linux (Render)
  pythonPath = "/opt/render/project/src/env/bin/python3";
}






/**
 * Notification Kit Hors Ligne
 */
export async function getAllKitPrincipaleOnlineIA(io) {
  try {
    // get all kit principale (disjoncteur)
    const KitTongouPrincipale = await prisma.kitTongouUser.findMany({
      where: {
        KitTongou : {
          AND: [
            { status: true },
            { kitTypeId: 1 },
            { online: true }
          ]
        },
      },
      include: {
        KitTongou: true,
        CompteElectriciteEau: {
          include: {
            Utilisateur: true
          }
        }
      }
    });

    for (let index = 0; index < KitTongouPrincipale.length; index++) {
      // let device_id = KitTongouPrincipale[index].KitTongou.idKitTongou
      let device_id = "bff96527f75046059crdcz"

      /**
       * get puissance 
       */
      let rep_puissance = await functionGetStatusKitTongou(device_id, "cur_power", io); 
      if (rep_puissance.data.result) {
        let puissanceValue = parseFloat(rep_puissance.data.result[0].value) / 10;
        let dataNow = new Date();

        // let heure = parseFloat(`${dataNow.getHours()}.${dataNow.getMinutes().toString().padStart(2, '0')}`);
        let heure = dataNow.getHours() + (dataNow.getMinutes()/60)
        let jour = (dataNow.getDay() + 6) % 7; // Pour que lundi soit 0, mardi 1, ..., dimanche 6
        let weekend = jour >= 5 ? 1 : 0; // Samedi (5) et Dimanche (6) sont considérés comme weeken
          

        let data = {
          "id" : device_id,
          "puissance" : parseFloat(puissanceValue.toFixed(1)),
          "heure": parseFloat(heure.toFixed(2)),
          "jour": jour,
          "weekend": weekend
        }
        
        //   let data = {
        //   "id": device_id,
        //   "puissance": 7,
        //   "heure": 15,
        //   "jour": 4,
        //   "weekend": 0
        // }
        

        console.log("data : ",data);

     

        // Appel API PYTHON
        let rep = {}
        try {
          rep = await axios.post(`http://192.168.88.76:5000/deviceConnected`, data);
          // console.log("rep : ",rep.data);
        } catch (error) {
          return res.status(500).json({ messageError: error, success: false });
        }


        let dataPython = rep.data
        let user = KitTongouPrincipale[index].CompteElectriciteEau.Utilisateur.email
        let userId = KitTongouPrincipale[index].CompteElectriciteEau.Utilisateur.id
        // console.log("user : " + user);
        // console.log("userId : " + userId);
        // console.log("dataPython : ",dataPython);
        // trouver l'utilisateur de ce kit
        // let user = await prisma.

        io.emit('notifIAPrediction', {
          message: `Prédiction de votre appareils ${user}`,
          type: "simple",
          utilisateurId : userId,
          Data: dataPython
        });

        let messageEnvoye = {
          message: `Prédiction de votre appareils ${user}`,
          type: "simple",
          utilisateurId : userId,
          Data: dataPython
        }



        console.log(messageEnvoye);
        console.log("------------------------------");
        console.log(); 
      }
    }

    

    console.log("Prédiction terminée");
    console.log("---------------------------------------------------------");
    console.log();
  

  } catch (error) {
    console.error("Erreur lors predicaiton appareil", error.message);
  }
}

