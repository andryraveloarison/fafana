import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv';
import axios from 'axios'
import axiosRetry from 'axios-retry'
import crypto from 'crypto';
import { comparaisonDate, functionGetStatisticsKitTongou } from '../Tongou/KitTongouController.js';
import { CalculTKwhEnAriaryTTC } from '../JiramaCalculController.js';
// import { getTokens } from '../../utils/tokenStore.js';
// import { GenerateSign } from '../ConfigController.js';
// import { CalculTKwhEnAriaryTTC, CalculTroisDernierFacture } from '../JiramaCalculController.js';
// import { ReponseIAKit } from '../ChatController.js';
// import { ReponseIACreateKitUser } from './KitTongouIAController.js';
// import { getConsommationKitTongouMois } from './KitTongouUserController.js';

config();

const prisma = new PrismaClient()
const end_point_ogemray = process.env.END_POINT_OGEMRAY;
const grand_type = process.env.GRANT_TYPE;
const code = process.env.CODE;
const client_id = process.env.CLIENT_ID;
const sign_method = process.env.SIGN_METHOD;
const key_tongou = process.env.KEY_TONGOU;
const user_id = process.env.USER_ID;
const asset_id = process.env.ASSET_ID;
const port_ecozipo = process.env.PORT_ECOZIPO;




/**
 * ------------------------------------------------------------------------------------------
 *
 */


/**
 * GET ALL AUTO BU COMPTEUR
 */
export const getAllAutoReleveByCompteur = async (req, res) => {
  try {
    const { compteElectriciteEauId } = req.body;
    if(!compteElectriciteEauId) return res.status(400).json({ message: "Veuillez ajouter l'ID du compteur.", success: false });

    // trouver si le compteur existe
    const compteur = await prisma.compteElectriciteEau.findFirst({
      where: {
        id: parseInt(compteElectriciteEauId)
      }
    })
    if(!compteur) return res.status(404).json({ message: "Ce compteur n'existe pas.", success: false });
    

    // trouver tout les relevées ajoutés
    const autoReleve = await prisma.autoReleve.findMany({
      where: {
        compteElectriciteEauId: parseInt(compteElectriciteEauId)
      },
      include:{
        CompteElectriciteEau: true
      },
      orderBy: {
        createdAt: 'desc', 
      },
    });

   
    res.status(200).json({
      Msg: `Liste auto relevé du compteur ${compteur.pseudoCompte} REF:${compteur.referenceClient}`,
      TotalCount: autoReleve.length,
      Data: autoReleve,
    });

  } catch (error) {
    res.status(500).json({ messageError: error.message});
  }
};




/**
 * GET DERNIER VALEUR AUTO RELEVE
 */
export const getDernierValeurAutoReleve = async (req, res) => {
  try {
    let { compteElectriciteEauId } = req.body;
    if(!compteElectriciteEauId) return res.status(400).json({ message: "Veuillez renseigner l'id de votre compteur", success: false })
    
    // find compte electricite eau by id
    const compteElectriciteEau = await prisma.compteElectriciteEau.findUnique({
      where: {
        id: parseInt(compteElectriciteEauId)
      },
      include: {
        Utilisateur: true
      }
    });
    if(!compteElectriciteEau) return res.status(404).json({ message: "Ce compteur n'existe pas", success: false })
    if(compteElectriciteEau.consommationInitial === null) return res.status(400).json({ message: "Vous devez initialisé votre ancien index dans votre compteur.", success: false });

    // trouver tout les kits principale qui utilisent ce compteur
    let kitTongouUser = await prisma.kitTongouUser.findMany({
      where: {
        compteElectriciteEauId: parseInt(compteElectriciteEauId)
      },
      include:{
        KitTongou: {
          include: {
            KitType: true,
            KitTypeTongou: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc', 
      },
    });

    kitTongouUser = kitTongouUser.filter(item => item.KitTongou.KitType.id === 1);


     // trouver si le kit a déjà fait une auto releve
    const autoReleve = await prisma.autoReleve.findFirst({
      where: {
        compteElectriciteEauId: parseInt(compteElectriciteEauId),
      },
      orderBy: {
        createdAt: 'desc', 
      },
    });


    let start_time = ""
    let end_time = ""
    let ancienIndex = 0
    let jourConsommationTotal = 0
    let consommationTotal = 0
    let total = 0
    let dateDebut = new Date()
    let jourConsommationPoser = compteElectriciteEau.joursConsommation
    let end_timeReleve = ""
    let rep_consommation_mois = ''
    let joursConsommation = 0
    let consommation = 0

    if(!autoReleve){
      ancienIndex = compteElectriciteEau.consommationInitial
      // trouver la consommation de chaque kit principale
      
      for (let index = 0; index < kitTongouUser.length; index++) {
        let device_id = kitTongouUser[index].KitTongou.idKitTongou
        let dateReleve = compteElectriciteEau.dateReleve
        dateReleve = new Date( formatYYYYMMDDtoDate(dateReleve))
        start_time = dateReleve
        end_time = dateReleve
        start_time.setDate(start_time.getDate() + 1)
        start_time = formatDateToYYYYMMDD(start_time)
        
        end_time.setDate((end_time.getDate() - 1) + jourConsommationPoser);
        end_time = formatDateToYYYYMMDD(end_time)

        console.log("jourConsommationPoser : ",jourConsommationPoser);
        console.log("start_time final : ", start_time)
        console.log("end_time final : ", end_time)

        
        try { 
          rep_consommation_mois = await functionGetStatisticsKitTongou(device_id, "add_ele", start_time, end_time, "sum", "days");

          if(rep_consommation_mois.data.success === false) return res.status(400).json({  message: error.message, success: false});
          joursConsommation = Object.keys(rep_consommation_mois.data.result).length;

          consommation = Object.values(rep_consommation_mois.data.result).reduce((acc, value) => acc + value, 0);
          consommation = parseFloat(consommation.toFixed(2));

        } catch (error) { 
          console.error("Erreur de récupération des valeurs sur le serveur : ", error);
          return res.status(400).json({  message: error.message, success: false});
        }
        
        if(joursConsommation > jourConsommationTotal) jourConsommationTotal = joursConsommation
        consommationTotal = consommationTotal + consommation
      }
    
    }else{
      ancienIndex = autoReleve.nouveauIndex
      let dateReleve = compteElectriciteEau.dateReleve
      dateReleve = new Date( formatYYYYMMDDtoDate(dateReleve))

      start_time = dateReleve
      end_time = dateReleve

      start_time.setDate(start_time.getDate() + 1)
      start_time = formatDateToYYYYMMDD(start_time)
      
      end_time.setDate((end_time.getDate() - 1) + jourConsommationPoser);
      end_time = formatDateToYYYYMMDD(end_time)

      console.log("jourConsommationPoser : ",jourConsommationPoser);
      console.log("start_time final : ", start_time)
      console.log("end_time final : ", end_time)


      // trouver la consommation de chaque kit principale
      for (let index = 0; index < kitTongouUser.length; index++) {
        let device_id = kitTongouUser[index].KitTongou.idKitTongou
        let joursConsommation = 0
        let consommation = 0
        let rep_consommation_mois = ""

        try { 
          rep_consommation_mois = await functionGetStatisticsKitTongou(device_id, "add_ele", start_time, end_time, "sum", "days");

          if(rep_consommation_mois.data.success === false) return res.status(400).json({  message: error.message, success: false});
          joursConsommation = Object.keys(rep_consommation_mois.data.result).length;
          // console.log("start_time : ",start_time);
          // console.log("end_time : ",end_time);
          
          // console.log("rep_consommation_mois.data : ",rep_consommation_mois.data);
          
          consommation = Object.values(rep_consommation_mois.data.result).reduce((acc, value) => acc + value, 0);
          consommation = parseFloat(consommation.toFixed(2));

        } catch (error) { 
          console.error("Erreur de récupération des valeurs sur le serveur : ", error);
          return res.status(400).json({  message: error.message, success: false});
        }
        
        if(joursConsommation > jourConsommationTotal) jourConsommationTotal = joursConsommation
        consommationTotal = consommationTotal + consommation
      }

    }

    if(!autoReleve){
      total = ancienIndex + consommationTotal
    }else{
      total = ancienIndex + consommationTotal + autoReleve.reste
    }
    
    const prixttt = await CalculTKwhEnAriaryTTC(compteElectriciteEauId, consommationTotal)
    const prix = parseFloat(prixttt.data.prixTTC.toFixed(2))




    res.status(200).json({
      Msg: `Votre auto relevé`,
      Data: {
        compteElectriciteEauId: parseInt(compteElectriciteEauId),
        ancienIndex: ancienIndex,
        consommationKit: consommationTotal,
        totalConsommation: total,
        joursConsommation: jourConsommationTotal,
        prixTTC: prix,
        dateAncienIndex: formatYYYYMMDDtoDate(start_time),
        dateNouveauIndex: formatYYYYMMDDtoDate(end_time)
      },
      success: true
    });
    
  } catch (error) {
    console.error("Erreur lors d'ajout auto releve kit tongou : ", error);
    res.status(500).json({
      message: error.message,
      success: false
    });
  }
};



/**
 * ADD AUTO RELEVE 
 */
export const addAutoReleveByCompte= async (req, res) => {
  try {
    let { compteElectriciteEauId, ancienIndex, consommationKit, totalConsommation, prixTTC, nouveauIndex, joursConsommation, dateAncienIndex, dateNouveauIndex} = req.body;
    if(!compteElectriciteEauId) return res.status(400).json({ message: "Veuillez renseigner l'id de votre compteur", success: false })
    if(!ancienIndex) return res.status(400).json({ message: "Veuillez renseigner l'ancien index de votre compteur", success: false })
    if(!consommationKit) return res.status(400).json({ message: "Veuillez renseigner la consommation de votre kit", success: false })
    if(!totalConsommation) return res.status(400).json({ message: "Veuillez renseigner la consommation totale", success: false })
    if(!joursConsommation) return res.status(400).json({ message: "Veuillez renseigner le nombre de jours de votre consommation", success: false })
    if(!dateAncienIndex) return res.status(400).json({ message: "Veuillez renseigner la date de votre ancien index", success: false })
    if(!dateNouveauIndex) return res.status(400).json({ message: "Veuillez renseigner la date de votre nouveau index", success: false })
    if(!prixTTC) return res.status(400).json({ message: "Veuillez renseigner le prix TTC", success: false })

    // find compte electricite eau by id
    const compteElectriciteEau = await prisma.compteElectriciteEau.findUnique({
      where: {
        id: parseInt(compteElectriciteEauId)
      },
      include: {
        Utilisateur: true
      }
    });
    if(!compteElectriciteEau) return res.status(404).json({ message: "Ce compteur n'existe pas", success: false })
    if(compteElectriciteEau.consommationInitial === null) return res.status(400).json({ message: "Vous devez initialisé votre ancien index dans votre compteur.", success: false });

    let dateNow = new Date()
    let dateReleve = new Date(dateNouveauIndex)
    if(dateNow.getTime() < dateReleve.getTime()) return res.status(400).json({ message: `Vous ne pouvez pas faire l'auto relevé qu'à partir du ${dateReleve.getDate()}/${dateReleve.getMonth() + 1}/${dateReleve.getFullYear()}`, success: false })

    if(!nouveauIndex) nouveauIndex = totalConsommation
    if(parseFloat(nouveauIndex) > totalConsommation) return res.status(400).json({ message: `L'index à ajouter doit être inférieur ou égal à ${totalConsommation}kwh`, success: false })
    if(parseFloat(nouveauIndex) < ancienIndex) return res.status(400).json({ message: `L'index à ajouter doit être supérieur à l'ancien index (${ancienIndex}kwh)`, success: false })
    let reste = parseFloat(totalConsommation - parseFloat(nouveauIndex)).toFixed(2);

    // console.log("compteElectriciteEauId : ",compteElectriciteEauId);
    // console.log("ancienIndex : ",ancienIndex);
    // console.log("consommation : ",consommationKit);
    // console.log("totalConsommation : ",totalConsommation);
    // console.log("nouveauIndex : ",nouveauIndex);
    // console.log("reste : ",reste);
    // console.log("joursConsommation : ",joursConsommation);
    // console.log("dateAncienIndex : ",dateAncienIndex);
    // console.log("dateNouveauIndex : ",dateNouveauIndex);

    let data = {
      compteElectriciteEauId: parseInt(compteElectriciteEauId),
      ancienIndex: ancienIndex,
      consommationKit: consommationKit,
      totalConsommation: totalConsommation,
      nouveauIndex: parseFloat(nouveauIndex),
      reste: parseFloat(reste),
      joursConsommation: joursConsommation,
      prix: parseFloat(prixTTC),
      dateAncienIndex,
      dateNouveauIndex
    }
    
    
    // add auto releve
    const addAutoReleve = await prisma.autoReleve.create({
      data: data
    });

    
    let isSameTime = comparaisonDate();
    dateNouveauIndex = new Date(dateNouveauIndex)
    
    if(!isSameTime){
      dateNouveauIndex.setDate(dateNouveauIndex.getDate() - 1); // Ajouter 1 jour
    }

    dateNouveauIndex = formatDateToYYYYMMDD(dateNouveauIndex)

    //  update dateReleve et jourconsommation compte electricite eau
    await prisma.compteElectriciteEau.update({
      where: {
        id: parseInt(compteElectriciteEauId)
      },
      data: {
        dateReleve: dateNouveauIndex,
        joursConsommation: parseInt(joursConsommation)
      }
    })

    // socket surpuissance
    // req.io.emit('notificationAutoReleve', {
    //   message: `Auto relevé a été bien envoyé par ${compteElectriciteEau.Utilisateur.email}`,
    //   type: "simpte",
    //   compteElectriciteId : parseInt(compteElectriciteEauId),
    // });

    // create notification surpuissance
    // await prisma.notification.create({
    //   data:{
    //       message: `Auto relevé a été bien envoyé par ${compteElectriciteEau.Utilisateur.email}`,
    //       type: "simple",
    //       compteElectriciteId : parseInt(compteElectriciteEauId),
    // }})



    res.status(200).json({
      Msg: `Auto relevé a été bien envoyé par ${compteElectriciteEau.Utilisateur.email}`,
      Data: addAutoReleve,
      success: true
    });
    
  } catch (error) {
    console.error("Erreur lors d'ajout auto releve kit tongou : ", error);
    res.status(500).json({
      message: error.message,
      success: false
    });
  }
};




/**
 * UPDATE AUTO RELEVE COMPTE ELECTRICITE EAU
 */
export const updateAutoReleveCompteElectriciteEau = async (req, res) => {
  try {
    const { compteElectriciteEauId, consommationInitial } = req.body;
    if(!compteElectriciteEauId) return res.status(400).json({ message: "Veuillez renseigner l'id du compteur", success: false })
    if(!consommationInitial) return res.status(400).json({ message: "Veuillez renseigner la consommation initiale de votre compteur", success: false })


    // find compte electricite eau by id
    const compteElectriciteEau = await prisma.compteElectriciteEau.findUnique({
      where: {
        id: parseInt(compteElectriciteEauId)
      },
      include: {
        Utilisateur: true
      }
    });
    if(!compteElectriciteEau) return res.status(404).json({ message: "Ce compteur n'existe pas", success: false })
    if(compteElectriciteEau.consommationInitial !== null) return res.status(400).json({ message: "Ce compteur a déjà une consommation initiale", success: false });

  
    
    // update consommationIntiale in compteur
    let response = await prisma.compteElectriciteEau.update({
      where: {
        id: parseInt(compteElectriciteEauId)
      },
      data: {
        consommationInitial: parseFloat(consommationInitial)
      }
    });


    res.status(200).json({
      Msg: `La consommation initiale de votre compteur ${response.pseudoCompte} REF:(${response.referenceClient}) a été mise à jour`,
      Data: response,
      success: true
    });

  } catch (error) {
    console.error("Erreur lors de la mise à jour de votre compteur : ", error);
    res.status(500).json({
      message: error.message,
      success: false
    });
  }
};






/**
 * ------------------------------------------------------------------------------------------
 *  UPDATE AUTOMATIQUE CONSOMMATION KIT APRES AUTO RELEVE OU PAS
 */



/**
 * UPDATE AUTOMATIQUE CONSOMMATION KIT APRES AUTO RELEVE OU PAS
 */
export const updateConsommationInitialeByKit = async (req, res) => {
  try {

    // trouver les comptes qui ont des kits
    let getCompteHaveKit = await prisma.compteElectriciteEau.findMany({
      where: {
        statusDisjoncteur : true
      },
    })

    function formatDateToYYYYMMDDHere(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Ajouter un zéro si nécessaire
      const day = String(date.getDate()).padStart(2, '0'); // Ajouter un zéro si nécessaire
      return `${year}${month}${day}`;
    }

    for (let index = 0; index < getCompteHaveKit.length; index++) {
      let jourConsommation = getCompteHaveKit[index].joursConsommation
      let dateReleve = getCompteHaveKit[index].dateReleve

      const yearReleve = parseInt(dateReleve.slice(0, 4));
      const monthReleve = parseInt(dateReleve.slice(4, 6)) - 1; // Les mois commencent à 0
      const dayReleve = parseInt(dateReleve.slice(6, 8));

      dateReleve = new Date(yearReleve, monthReleve, dayReleve)
      let dateNow = new Date()


      let i = 1
     
      while(dateReleve.getTime() <= dateNow.getTime()){
        // console.log("i = ",i);
        // console.log("kit : ",kitPrincipale[index].KitTongou.idKitTongou); 
        dateReleve.setDate(dateReleve.getDate() + 1); // + 1 jour le commencement du date
        // console.log("dateNow : ",dateNow);
        // console.log("dateReleve : ",dateReleve);
        let start_time = formatDateToYYYYMMDDHere(dateReleve)
        // console.log("jourConsommation : ",jourConsommation);
        dateReleve.setDate(dateReleve.getDate() + jourConsommation);
        let end_time = dateReleve
        // console.log("end_time : ",end_time);

        
        dateReleve.setDate(dateReleve.getDate() - 1); // - 1 pour avoir la valeur du nombre de jour

        if(end_time.getTime() < dateNow.getTime()){
          // console.log("ato no mande");
          let compteElectriciteEauId = getCompteHaveKit[index].id
          end_time = formatDateToYYYYMMDDHere(dateReleve)

          // get all kit principale by compteElectriciteEauId 
            const kitPrincipale = await prisma.kitTongouUser.findMany({
              where: {
               AND: [
                { compteElectriciteEauId : compteElectriciteEauId},
                {  KitTongou: {
                    KitType: {
                      id: 1
                    }
                  } 
                }
               ]
              },
              include:{
                KitTongou : {
                  include: {
                    KitType: true
                  }
                },
                // CompteElectriciteEau: true
              }
            })

            let consommationInitialCompteur = getCompteHaveKit[index].consommationInitial
            // console.log("consommationInitialCompteur : ",consommationInitialCompteur);

            for (let index = 0; index < kitPrincipale.length; index++) {
              let device_id = kitPrincipale[index].KitTongou.idKitTongou
              let rep_consommation_mois = await functionGetStatisticsKitTongou(device_id, "add_ele", start_time, end_time, "sum", "days");
              const totalConsommation = Object.values(rep_consommation_mois.data.result).reduce((acc, value) => acc + value, 0);
              const consommationKWh = totalConsommation.toFixed(2);
              // console.log("device_id : ",device_id);
              // console.log("consommationKWh : ",consommationKWh);
              consommationInitialCompteur = consommationInitialCompteur + parseFloat(consommationKWh)

            }
            // console.log("dateReleve : ",end_time);
            // console.log("consommationInitialCompteur final : ",consommationInitialCompteur);

            // update compteElectriciteEau
            await prisma.compteElectriciteEau.update({
              where: { id : compteElectriciteEauId },
              data: {
                consommationInitial : consommationInitialCompteur,
                dateReleve: end_time
              }
            })
        }
        

        
        
        i ++        
      }
    }


    getCompteHaveKit = await prisma.compteElectriciteEau.findMany({
      where: {
        statusDisjoncteur : true
      },
    })
    

    res.status(200).json({
      Msg: `Les kit principales`,
      Data: getCompteHaveKit,
      success: true
    });
    
  } catch (error) {
    console.error("Erreur lors d'ajout auto releve kit tongou : ", error);
    res.status(500).json({
      message: error.message,
      success: false
    });
  }
};








// export function formatDateToYYYYMMDD(date) {
//   const year = date.getFullYear();
//   const month = String(date.getMonth() + 1).padStart(2, '0'); // Ajouter un zéro si nécessaire
//   const day = String(date.getDate() - 1).padStart(2, '0'); // Ajouter un zéro si nécessaire
//   return `${year}${month}${day}`;
// }


export function formatDateToYYYYMMDD(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Ajouter un zéro si nécessaire
  const day = String(date.getDate()).padStart(2, '0'); // Ajouter un zéro si nécessaire
  return `${year}${month}${day}`;
}


export function formatYYYYMMDDtoDate(dateReleve) {
  const year = parseInt(dateReleve.slice(0, 4));
  const month = parseInt(dateReleve.slice(4, 6)) - 1; // Les mois commencent à 0
  const day = parseInt(dateReleve.slice(6, 8));

  return new Date(year, month, day);
}

// export function formatYYYYMMDDtoDate(date) {
//   let year = parseInt(date.substring(0, 4));
//   let month = parseInt(date.substring(4, 6)) - 1; // Les mois sont 0-indexés
//   let day = parseInt(date.substring(6, 8)) + 1; // Ajouter 1 jour
//   const isSameTime = comparaisonDate();
//   if(isSameTime){
//     day = parseInt(date.substring(6, 8))
//   }
//   return new Date(year, month, day);
// }