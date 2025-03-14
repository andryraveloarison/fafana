import express from 'express';
import axios from 'axios'
import cron from 'node-cron'
import cors from 'cors';
import FileUpload from "express-fileupload";
import multer from "multer";
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import twilio from 'twilio';
import http from 'http';
import { Server as SocketIoServer } from 'socket.io';
import ProvinceRoute from './routes/ProvinceRoute.js';
import ZoneRoute from './routes/ZoneRoute.js';
import UserRoute from './routes/user/UserRoute.js';
import BlogRoute from './routes/Blog/BlogRoute.js';
import CodeCalculRoute from './routes/Electricite/CodeCalculRoute.js';
import ChatRoute from './routes/ChatRoute.js';
import NotificationRoute from './routes/NotificationRoute.js';
import KitGroupeRoute from './routes/KitGroupeRoute.js';
import PaiementRoute from './routes/PaiementRoute.js';
import ConfigRoute from './routes/ConfigRoute.js';
import KitTypeRoute from './routes/KitTypeRoute.js';
import KitTongouRoute from './routes/Tongou/KitTongouRoute.js';
import ElectriciteRoute from './routes/Electricite/ElectriciteRoute.js';
import AnalyseIARoute from './routes/AnalyseIA/AnalyseIARoute.js';
import CompteRoute from './routes/Compte/CompteRoute.js'

import { comparaisonDate, functionBlockedKit, notificationConsommationByDay, notificationConsommationByWeek, seeKitOfflineinDynamicTime } from './controllers/Tongou/KitTongouController.js';
import WeatherRoute from './routes/Meteo/WeatherRoute.js';
import ExpertRoute from './routes/ExpertRoute.js';
import CodeRoute from './routes/Electricite/CodeRoute.js';
import { functionupdateValueKitHybrideByPrincipale, getConsommationKitTongouMois } from './controllers/Tongou/KitTongouUserController.js';
import { getAllKitPrincipaleOnlineIA } from './controllers/Tongou/IAController.js';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const port_ecozipo = process.env.PORT_ECOZIPO;

console.log("DATABASE_URL : ", process.env.DATABASE_URL); // Vérifiez la valeur

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

app.use(express.json());
app.use(FileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
}));

app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'assets')));

// Configurer CORS
app.use(cors());


// const app = express();
// const PORT = process.env.PORT || 5000;
// const server = http.createServer(app);
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);
// const prisma = new PrismaClient({
//   log: ['query', 'info', 'warn', 'error'],
//   datasources: {
//     db: {
//       url: process.env.DATABASE_URL,
//     },
//   },
// });


// // console.log("DATABASE_URL : ",process.env.DATABASE_URL);


// app.use(express.json());
// app.use(FileUpload({
//   useTempFiles: true,
//   tempFileDir: '/tmp/',
// }));

// app.use(morgan('dev'));
// app.use(express.static(path.join(__dirname, 'assets')));

// // Configurer CORS
// app.use(cors({
//     origin: 'http://localhost:3000', // URL de votre frontend React
//     methods: ['GET', 'POST', 'PUT'], // Inclure PUT si nécessaire
//     allowedHeaders: ['Content-Type']
// }));

// Configurer le serveur Socket.IO avec CORS
const io = new SocketIoServer(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT'] // Inclure PUT si nécessaire
  }
});

// Connexion des clients
io.on('connection', (socket) => {
  console.log('New client connected');
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Middleware pour ajouter l'instance de Socket.IO à req
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Configuration de multer pour stocker les fichiers
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const client = twilio(accountSid, authToken);



// client.verify.v2.services('VAef0c6f02b85785c2afd670674fe1f304')
//   .verifications
//   .create({ to: '+261381099379', channel: 'sms' })
//   .then(verification => console.log(verification.sid))
//   .catch(error => console.error(error));

app.get('/', (req, res) => {
  res.send('Vous êtez sur EcoZipo');
});





// Routes
app.use(ProvinceRoute);
app.use(ZoneRoute);
app.use(BlogRoute);
app.use(CodeCalculRoute);
app.use(ChatRoute);
app.use(NotificationRoute);
app.use(KitGroupeRoute);
app.use(PaiementRoute);
app.use(ConfigRoute);
app.use(KitTypeRoute);
app.use(ExpertRoute);
// tongou
app.use(KitTongouRoute);

// electricite
app.use(ElectriciteRoute);

// meteo
app.use(WeatherRoute);

// code
app.use(CodeRoute)

// user
app.use(UserRoute);

// analyse ia
app.use(AnalyseIARoute);

app.use(CompteRoute);


/**
 *  Load Kit
 */
async function reinitialiserNotifStatusKit() {
  try {

     // UPDATE KIT STATUS
     const kit = await prisma.kitValeurBut.findMany()
     for (let index = 0; index < kit.length; index++) {
       await prisma.kitValeurBut.update({
         where: { id: kit[index].id },
         data: {
           msg1: false,
           msg2: false,
           msg3: false
         }
       });
     }
 
    console.log("Toutes les notifications des kits ont été réinitialisées.");
    

  } catch (err) {
      console.error("Vous êtez hors ligne, Veuillez vérifier votre connexion!");
  }
}

// Planifier la tâche pour s'exécuter tous les jours à 00:01
cron.schedule('59 20 * * *', async () => {
  console.log('Déclenchement de la réinitialisation des notifications des kits à 00:01...');
  await reinitialiserNotifStatusKit();
});

//  notification consommation par jour tout les 12h
// cron.schedule('0 */9 * * *', async () => {
//   console.log('Déclenchement de la notification toutes les 12 heures...');
//   await notificationConsommationByDay(io, 1);
// });



//  notification consommation par jour tout les 24h
cron.schedule('59 20 * * *', async () => {
  console.log(`[${new Date().toISOString()}] Déclenchement de la notification à 23h59...`);
  await notificationConsommationByDay(io, 2);
});


// notification par semaine le dimanche à 23h59
cron.schedule('59 20 * * 0', async () => {
  console.log(`[${new Date().toISOString()}] Déclenchement de la notification du dimanche à 23h59...`);
  await notificationConsommationByWeek(io);
});



// notification auto releve par semaine le dimanche à 23h59
// cron.schedule('59 20 * * 0', async () => {
//   console.log(`[${new Date().toISOString()}] Déclenchement de la notification auto relevé à 23h59...`);
//   await notificationAutoReleveByWeek(io);
// });





/**
 * VOIR L'HEURE LOCALE ET LA DATE DU SERVEUR
 */
// function logCurrentTimeEverySecond() {
//   setInterval(() => {
//     const now = new Date();
//     console.log(`Heure actuelle : ${now.toISOString()} - Heure locale : ${now.toLocaleTimeString()}`);
//   }, 1000); // 1000 ms = 1 seconde
// }

// logCurrentTimeEverySecond();





/**
 * UPDATE LIMITE KIT HYBRIDE
 */
function updateLimiteKitHybride() {
  setInterval(async () => {
    await functionupdateValueKitHybrideByPrincipale();
  }, 120000); // 120 000 ms = 2 minutes
}

updateLimiteKitHybride();





/**
 * PREDICTION DEVICE USED BY IA
 */
function functionPredictionDeviceUsedByIA() {
  setInterval(async () => {
    await getAllKitPrincipaleOnlineIA(io);
  }, 10000); // 120 000 ms = 2 minutes
}

// functionPredictionDeviceUsedByIA();





/**
 * UPDATE STATE ONLINE ALL KIT
 */
function updateAllStateOnlineKit() {
  setInterval(async() => {

    try {
      let app_tongou = await axios.get(`${port_ecozipo}/getallkittongou`);
      
      for (let index = 0; index < app_tongou.data.result.length; index++) {
        let kit = app_tongou.data.result[index];
        let kitOnOff = JSON.parse(kit.status[0].value);
        let online = kit.online;
        if (kitOnOff === "true") kitOnOff = true;
        else if (kitOnOff === "false") kitOnOff = false;

        let idKit = kit.id;
        let existingKit = await prisma.kitTongou.findFirst({
          where: {
            idKitTongou: idKit,
          },
        });

        if (existingKit) {
          await prisma.kitTongou.update({
            where: {
              id: existingKit.id,
            },
            data: {
              online: online,
              kitOnOff: kitOnOff,
            },
          });}
      }
    } catch (error) {
      console.error("Error updating kits to 10s");
    }

  }, 10000); // 1000 ms = 1 seconde
}
let isSameTime = comparaisonDate();
if(isSameTime){
  updateAllStateOnlineKit();
}



/**
 * UPDATE VALEUR COMPTEUR
 */
function updateValeurCompteurByKit() {
  // 300000
  let timeline = isSameTime ? 60000 : 300000
  console.log("timeline : ",timeline);
  setInterval(async() => {
    try {

      // trouver les compteElectricite qui sont rattaché par des kits
      const compteElectriciteHaveKit = await prisma.compteElectriciteEau.findMany({
        where: {
          statusDisjoncteur: true
        }
      });

    

      for (let index = 0; index < compteElectriciteHaveKit.length; index++) {
        let compteElectriciteEauId = compteElectriciteHaveKit[index].id;

        let zoneId = compteElectriciteHaveKit[index].zoneId
        let tarif = compteElectriciteHaveKit[index].tarif
  
  
        let prix = await prisma.prix.findFirst({
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

        let consommationParTranche = {
          1 : 0.0,
          2 : 0.0,
          3 : 0.0,
          4 : 0.0
        }

        // trouver les kits user principal par rapport au compteur
        const kitsUserPrincipal = await prisma.kitTongouUser.findMany({
          where: {
            AND: [
              { compteElectriciteEauId: parseInt(compteElectriciteEauId) },
              { KitTongou: {
                  KitType: {
                    id : 1
                  }
              }}
            ]
          },
          include: {
            KitTongou: true,
            CompteElectriciteEau: true
          }
        });

        
        let consommationInitial = kitsUserPrincipal[0].CompteElectriciteEau.consommationInitial
        let dateReleve = kitsUserPrincipal[0].CompteElectriciteEau.dateReleve
        let dateNow = new Date()
        let kwhConsomme = 0


        for (let index = 0; index < kitsUserPrincipal.length; index++) {
          let device_id = kitsUserPrincipal[index].KitTongou.idKitTongou;
          let rep_consommation_mois = await getConsommationKitTongouMois(device_id, compteElectriciteEauId, dateReleve, dateNow);
          // console.log("rep_consommation_mois : ",rep_consommation_mois);
          let consommationMois = rep_consommation_mois.data.consommation
          consommationInitial = consommationInitial + consommationMois;
          kwhConsomme = kwhConsomme + consommationMois;
        }

        let valid = false
        let i = 1
        while( valid === false){
          if(kwhConsomme > quantiteParTranche[i]){
            kwhConsomme = kwhConsomme - quantiteParTranche[i]
            consommationParTranche[i] = quantiteParTranche[i]
          }else{
            consommationParTranche[i] = kwhConsomme
            
            valid = true
          }
          i ++
        }

        let indiceTrance = 1
        if(consommationParTranche[3] > 0) indiceTrance = 3
        else if(consommationParTranche[2] > 0) indiceTrance = 2
        else if(consommationParTranche[1] > 0) indiceTrance = 1

        // mise à jour tranche index compteElectriciId
        await prisma.compteElectriciteEau.update({
          where: {
            id: compteElectriciteEauId
          },
          data: {
            indiceTrance: indiceTrance
          }
        });


        for (let index = 0; index < kitsUserPrincipal.length; index++) {
          // update consommationInitial kit
          let kitTongouId = kitsUserPrincipal[index].kitTongouId;
          await prisma.kitTongou.update({
            where:{
              id: kitTongouId
            },
            data: {
              consommationInitial: parseFloat(consommationInitial)
            }
          })
          
        }
        
      }
    
      
      console.log("consommation compteur mise à jour");
      console.log("-------------------------------------------------------------------------");

    } catch (error) {
      console.error ("Erreur lors de la mise à jour de valeur de compteur : ",error)
    }
  }, timeline); // 1000 ms = 1 seconde
};
updateValeurCompteurByKit();


// Vérification de la connexion à la base de données avant de démarrer le serveur
(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('Connected to the database successfully');

    

    server.listen(PORT, () => {

      // voir les kit hors ligne tout les 2 min
      // seeKitOfflineinDynamicTime(2, "minute", io) // délestage par exemple


      // voir les kit hors ligne tout les 30 min
      // seeKitOfflineinDynamicTime(15, "minute", io)


      // voir les kit hors ligne tout le 1h
      // seeKitOfflineinDynamicTime(1, "hour", io)

      // voir les kit hors ligne tout le 6h
      // seeKitOfflineinDynamicTime(6, "hour", io)


      // voir les kit hors ligne tout le 12h
      // seeKitOfflineinDynamicTime(12, "hour", io)

      // voir les kit hors ligne tout le 18h
      // seeKitOfflineinDynamicTime(18, "hour", io)

      // voir les kit hors ligne tout le 24h
      // seeKitOfflineinDynamicTime(24, "hour", io)

      // allumer automatiquement les kits
      // setInterval(allumeAutomatiquementKit, 1000);

      // load blocked kit
      // setInterval(functionBlockedKit, 5000);


      console.log('Server is listening on port: http://localhost:' + PORT.toString());
    });
    
  } catch (error) {
    console.error('Error connecting to the database:', error);
    process.exit(1); // Arrêter le processus si la connexion échoue
  }
})();


