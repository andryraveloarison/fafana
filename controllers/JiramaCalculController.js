import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv';
import axios from 'axios'
import { getConsommationKitTongouMois } from './Tongou/KitTongouUserController.js';
import { functionCalculElectricite } from './Electricite/CodeCalculElectricite.js';

config();

const prisma = new PrismaClient()
const port_ecozipo = process.env.PORT_ECOZIPO;






// Fonction pour calcul electricite
export async function CalculEletriciteKit(tourneId, communeId, tarif, kwhConsomme, puissance, type) {

  // kwhConsomme = kwhConsomme + 50
  let kwhConsommeTotal = kwhConsomme
  try {
    
    const activite = "e"

    const isValid = /^\d{11}$/.test(tourneId);
    if (!isValid) {
        return res.status(400).json({ error: 'Reference client invalide!' });
    }

    const tourneSlice = tourneId.slice(0, 7)


    if (!tourneId) return { messageError: "Veuillez ajouter le référence client!" };
    if (!communeId) return { messageError: "Veuillez séléctionner votre commune!" };
    if (!tarif) return { messageError: "Veuillez séléctionner tarif!" };
    if (!puissance) return { messageError: "Veuillez séléctionner le puissance de votre compteur!" };



        const agence = await prisma.agence.findFirst({
            where:{
              AND:[
                {tourneId : tourneSlice},
                {communeId : parseInt(communeId)}
              ]
            },
        })
        

        if (!agence) return { messageError: "Réference client introuvable" };


        const fne = await prisma.fne.findUnique({
            where:{
              tarif : tarif
            }
        })


        const prix = await prisma.prix.findFirst({
            where: {
              AND: [
                { zoneId: agence.zoneId },
                { tarif: tarif }
              ]
            }
        });

        
        if (!prix) return { messageError: "prix introuvable" };

        const taxe = await prisma.taxe.findFirst({
          where: {
            AND: [
              { site: agence.agenceCode },
              { communeId: communeId },
              { activite: activite }
            ]
          }
        })



        if (!taxe) return { messageError: "Taxe introuvable" };
        
        let valid = false
        
        let i = 1
      //   let  = nouvel - ancien
        
        let quantiteParTranche = {
          1 : prix.q1,
          2 : prix.q2,
          3 : prix.q3,
          4 : prix.q4
        }
       
        // let kit = {}
        // kit = await prisma.kit.findUnique({
        //   where:{
        //     id : parseInt(kitId)
        //   },
        //   include:{
        //       KitType: true
        //   }
        // })

        // quantiteParTranche = {
        //   1 : prix.q1,
        //   2 : prix.q2,
        //   3 : prix.q3,
        //   4 : prix.q4
        // }
        // if(kit.kitTypeId === 1) {
        //   quantiteParTranche = {
        //     1 : prix.q1,
        //     2 : prix.q2,
        //     3 : prix.q3,
        //     4 : prix.q4
        //   }
        //   if(kwhConsomme >= quantiteParTranche[1]){
        //     console.log("kwhConsomme : ",kwhConsomme);
        //     console.log("utilisateurId : ",utilisateurId);
        //     // let tranche = 1
        //     // let rep = {}
        //     // try {
        //     //   rep = await axios.post(`${port_ecozipo}/updatetranchekit`, {utilisateurId : utilisateurId, tranche: tranche});
        //     //   console.log(rep.data);
        //     // } catch (error) {
        //     //     return res.status(500).json({ messageError: "Vous êtez hors ligne, Veuillez vérifier votre connexion!" });
        //     // }
        //   }
        // }else{
        //   if(kit.t1 === null){
        //     quantiteParTranche = {
        //       1 : prix.q1,
        //       2 : prix.q2,
        //       3 : prix.q3,
        //       4 : prix.q4
        //     }
        //   }else if(parseFloat(kit.t1) >= 0)
        //   quantiteParTranche = {
        //     1 : kit.t1,
        //     2 : kit.t2 || prix.q2,
        //     3 : kit.t3 || prix.q3,
        //     4 : kit.t4 || prix.q4
        //   }
        // }

        // console.log("quantiteParTranche : ",quantiteParTranche)


        let prixParTranche = {
            1 : prix.p1,
            2 : prix.p2,
            3 : prix.p3,
            4 : prix.p4
        }

        let consommationParTranche = {
          1 : 0.0,
          2 : 0.0,
          3 : 0.0,
          4 : 0.0
        }

        let prixTotalParTranche = {
          1 : 0.0,
          2 : 0.0,
          3 : 0.0,
          4 : 0.0
        }

        /**
         * CALCULER LA VALEURS PAR TRANCHE
         */
        while( valid === false){
          if(kwhConsomme > quantiteParTranche[i]){
            kwhConsomme = kwhConsomme - quantiteParTranche[i]
            consommationParTranche[i] = quantiteParTranche[i]
            prixTotalParTranche[i] = quantiteParTranche[i] * prixParTranche[i]
          }else{
            consommationParTranche[i] = kwhConsomme
            prixTotalParTranche[i] = kwhConsomme * prixParTranche[i]
            valid = true
          }
          i ++
        }
        
        let prime = prix.prime
        let redevance = prix.redevance
        let prixKwhTotal = prixTotalParTranche[1] + prixTotalParTranche[2] + prixTotalParTranche[3] + prixTotalParTranche[4] 
        let primeTotal = prime * puissance
        
        /**
         * SOUS TOTAL JIRAMA
         */
        let sousTotalJirama = prixKwhTotal + redevance + primeTotal
        
        /**
         * TAXE COMMUNALE
         **/ 
        let taxe_communale_prix = taxe.taxe_communale / 100
        let taxe_communale_tranche = {
          1 : 0,
          2 : 0,
          3 : 0,
          4 : 0
        }
        
        if(taxe.type_taxe === 1){
          taxe_communale_tranche = {
            1 : prixTotalParTranche[1] * taxe_communale_prix,
            2 : prixTotalParTranche[2] * taxe_communale_prix,
            3 : prixTotalParTranche[3] * taxe_communale_prix,
            4 : prixTotalParTranche[4] * taxe_communale_prix
          }
        }else if (taxe.type_taxe === 2){
          taxe_communale_tranche = {
            1 : consommationParTranche[1] * taxe.taxe_communale,
            2 : consommationParTranche[2] * taxe.taxe_communale,
            3 : consommationParTranche[3] * taxe.taxe_communale,
            4 : consommationParTranche[4] * taxe.taxe_communale
          }
        }
       
        let taxe_communale = taxe_communale_tranche[1] + taxe_communale_tranche[2] + taxe_communale_tranche[3] + taxe_communale_tranche[4]
        
        /**
         * SURTAXE COMMUNALE
         **/ 
        let surtaxe_prix = taxe.surtaxe / 100
        let surtaxe_tranche = {
          1 : 0,
          2 : 0,
          3 : 0,
          4 : 0
        }    
        if(taxe.type_surtaxe === 1){
          surtaxe_tranche = {
            1 : prixTotalParTranche[1] * surtaxe_prix,
            2 : prixTotalParTranche[2] * surtaxe_prix,
            3 : prixTotalParTranche[3] * surtaxe_prix,
            4 : prixTotalParTranche[4] * surtaxe_prix
          }
        }else if (taxe.type_surtaxe === 2){
          surtaxe_tranche = {
            1 : consommationParTranche[1] * taxe.surtaxe,
            2 : consommationParTranche[2] * taxe.surtaxe,
            3 : consommationParTranche[3] * taxe.surtaxe,
            4 : consommationParTranche[4] * taxe.surtaxe
          }
        }

        let surtaxe = surtaxe_tranche[1] + surtaxe_tranche[2] + surtaxe_tranche[3] + surtaxe_tranche[4]


        /**
         * FNE
         **/ 
        let fne_tranche = {
          1 : prixTotalParTranche[1] * fne.t1,
          2 : prixTotalParTranche[2] * fne.t2,
          3 : prixTotalParTranche[3] * fne.t3,
          4 : prixTotalParTranche[4] * fne.t4
        }
        let fne_taxe = fne_tranche[1] + fne_tranche[2] + fne_tranche[3] + fne_tranche[4]
        fne_taxe = fne_taxe / 100

        
        
        /**
         * TAXE
         */
        let tva_ = 0
        let tva_value = 0.2
       
        
        

        // si tva est frappé partiellement
        if(type === "partiel"){
            // si votre tarif est 10 la total du consommation devrait > 100kwh
            if(parseInt(tarif) === 10){
              if(consommationParTranche[2] > 50){
                let tvaParTranche = {
                  1 : 0,
                  2 : ((consommationParTranche[2] - 50) * prixParTranche[2]) * tva_value,
                  3 : prixTotalParTranche[3] * tva_value,
                  4 : prixTotalParTranche[4] * tva_value,
                  5 : taxe_communale * tva_value,
                  6 : surtaxe * tva_value,
                  7 : fne_taxe * tva_value,
                  8 : redevance * tva_value,
                  9 : primeTotal * tva_value,
                }
                tva_ = tvaParTranche[1] + tvaParTranche[2] + tvaParTranche[3] + tvaParTranche[4] + tvaParTranche[5] + tvaParTranche[6] + tvaParTranche[7] + tvaParTranche[8] + tvaParTranche[9]
              }

            // si tarif est > 10 calcul de tva normal 
            }else{
              let tvaParTranche = {
                1 : ((consommationParTranche[1] - 100) * prixParTranche[1]) * tva_value,
                2 : prixTotalParTranche[2] * tva_value,
                3 : prixTotalParTranche[3] * tva_value,
                4 : prixTotalParTranche[4] * tva_value,
                5 : taxe_communale * tva_value,
                6 : surtaxe * tva_value,
                7 : fne_taxe * tva_value,
                8 : redevance * tva_value,
                9 : primeTotal * tva_value,
              }
              tva_ = tvaParTranche[1] + tvaParTranche[2] + tvaParTranche[3] + tvaParTranche[4] + tvaParTranche[5] + tvaParTranche[6] + tvaParTranche[7] + tvaParTranche[8] + tvaParTranche[9]
            }
      
        // si tva est frappé totalement, tout est taxé 
        }else if(type === "total"){
          let tvaParTranche = {
            1 : prixTotalParTranche[1] * tva_value,
            2 : prixTotalParTranche[2] * tva_value,
            3 : prixTotalParTranche[3] * tva_value,
            4 : prixTotalParTranche[4] * tva_value,
            5 : taxe_communale * tva_value,
            6 : surtaxe * tva_value,
            7 : fne_taxe * tva_value,
            8 : redevance * tva_value,
            9 : primeTotal * tva_value,
          }
          tva_ = tvaParTranche[1] + tvaParTranche[2] + tvaParTranche[3] + tvaParTranche[4] + tvaParTranche[5] + tvaParTranche[6] + tvaParTranche[7] + tvaParTranche[8] + tvaParTranche[9]
        }else if(type === "exonoré"){
            tva_ = 0
        }
          
        

        /**
         * PRIX NET
         */
        // console.log("sousTotalJirama : ",sousTotalJirama);
        // console.log("taxe_communale : ",taxe_communale);
        // console.log("surtaxe : ",surtaxe);
        // console.log("fne_taxe : ",fne_taxe);
        // console.log("tva_ : ",tva_);
        let prix_net = sousTotalJirama + taxe_communale + surtaxe + fne_taxe + tva_

      
        const facture = {
          reference_client : agence.tourneId,
          categorie : type,
          agence : agence.agence,
          commune : agence.commune,
          tarif : tarif,
          puissance : puissance,
          type: type,
          consommation : kwhConsommeTotal,
          prixKwh : prixKwhTotal,
          prixParTranche : prixParTranche,
          consommationParTranche : consommationParTranche,
          prixTotalParTranche : prixTotalParTranche,
          prime : primeTotal,
          redevance : redevance,
          taxe_communale : taxe_communale,
          surtaxe : surtaxe,
          fne : fne_taxe,
          tva : tva_,
          prix_net : prix_net
        }      
        // console.log(facture);
       
 
     return {facture : facture}

  } catch (error) {
    return { messageError: 'Erreur serveur' };
  }
  
}


// Fonction pour calculerLesTroisDerniersFactures
export async function CalculTroisDernierFacture(compteElectriciteEauId, modeGestionId) {
  try {

    const existingCompteElectriciteEauUser = await prisma.compteElectriciteEau.findUnique({
      where: {
          id: parseInt(compteElectriciteEauId)
      }
    });
    if (!existingCompteElectriciteEauUser) return { message: "Ce compte n'existe pas!", success: false };

    const modelGestionExit = await prisma.modeGestion.findUnique({
      where: {
        id: parseInt(modeGestionId)
      }
    })
    if (!modelGestionExit) return { message: "Ce mode de gestion n'existe pas!", success: false }
         
    let mois1 = existingCompteElectriciteEauUser.mois1
    let mois2 = existingCompteElectriciteEauUser.mois2
    let mois3 = existingCompteElectriciteEauUser.mois3
    if (mois1 == null || mois2 == null || mois3 == null) return { message: "Ce compte n'a pas encore envoyé ces 3 derniers facture!", success: false };
    let min = Math.min(mois1, mois2, mois3)
    let zoneId = existingCompteElectriciteEauUser.zoneId
    let tarif = existingCompteElectriciteEauUser.tarif

    let kwhConsomme = min
    
    const prix = await prisma.prix.findFirst({
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

    let prixParTranche = {
        1 : prix.p1,
        2 : prix.p2,
        3 : prix.p3,
        4 : prix.p4
    
    }


    let consommationParTranche = {
      1 : 0.0,
      2 : 0.0,
      3 : 0.0,
      4 : 0.0
    }

    let prixTotalParTranche = {
      1 : 0.0,
      2 : 0.0,
      3 : 0.0,
      4 : 0.0
    }
    let valid = false
    let i = 1

    while( valid === false){
      if(kwhConsomme > quantiteParTranche[i]){
        kwhConsomme = kwhConsomme - quantiteParTranche[i]
        consommationParTranche[i] = quantiteParTranche[i]
        prixTotalParTranche[i] = quantiteParTranche[i] * prixParTranche[i]
      }else{
        consommationParTranche[i] = kwhConsomme
        prixTotalParTranche[i] = kwhConsomme * prixParTranche[i]
        valid = true
      }
      i ++
    }
    let prixTotal = prixTotalParTranche[1] + prixTotalParTranche[2] + prixTotalParTranche[3] + prixTotalParTranche[4]
    let valeurEconomiser = 0
    let Msg = ""
    let tranche = 0
    
    // if(consommationParTranche[4] != 0) Msg = "Nous allons vous aider à économiser votre consommation en électricité à 25%", valeurEconomiser = 25 / 100, tranche = 4
    // else if(consommationParTranche[3] != 0) Msg = "Nous allons vous aider à économiser votre consommation en électricité à 20%", valeurEconomiser = 20 / 100, tranche = 3
    // else if(consommationParTranche[2] != 0) Msg = "Nous allons vous aider à économiser votre consommation en électricité à 15%", valeurEconomiser = 15 / 100, tranche = 2
    // else if(consommationParTranche[1] != 0) Msg = "Nous allons vous aider à économiser votre consommation en électricité à 10%", valeurEconomiser = 10 / 100, tranche = 1

   
    
    if(modeGestionId === 1) Msg = `Nous allons vous aider à économiser votre consommation en électricité à ${modelGestionExit.pourcent}%`, valeurEconomiser = modelGestionExit.pourcent / 100, tranche = 4
    else if(modeGestionId === 2) Msg = `Votre consommation en électricité est normale`, valeurEconomiser = 1, tranche = 3
    else if(modeGestionId === 3) Msg = `Votre consommation en électricité augmente de ${modelGestionExit.pourcent}%`, valeurEconomiser = modelGestionExit.pourcent / 100, tranche = 2

    // let valeur = consommationParTranche[tranche]
    // let reduction = (valeur * valeurEconomiser).toFixed(2)
    
    let kwhConsommeNew = min
    let reduction = (kwhConsommeNew * valeurEconomiser).toFixed(2)
    if(modeGestionId === 1) kwhConsommeNew = parseFloat(kwhConsommeNew) - parseFloat(reduction)
    if(modeGestionId === 2) kwhConsommeNew = parseFloat(kwhConsommeNew) 
    if(modeGestionId === 3) kwhConsommeNew = parseFloat(kwhConsommeNew) + parseFloat(reduction)

      
    let trancheConsommationNormal = {
      1 : 0.0,
      2 : 0.0,
      3 : 0.0,
      4 : 0.0
    }
    i = 1
    valid = false
    while( valid === false){
      if(kwhConsommeNew > quantiteParTranche[i]){
        kwhConsommeNew = kwhConsommeNew - quantiteParTranche[i]
        trancheConsommationNormal[i] = quantiteParTranche[i]
      }else{
        trancheConsommationNormal[i] = kwhConsommeNew
        valid = true
      }
      i ++
    }

    // for (let index = 1; index <= tranche; index++) {
    //   if(index === tranche){
    //     trancheConsommationNormal[index] = parseFloat(reduction)
    //   }else{
    //     trancheConsommationNormal[index] = consommationParTranche[index]
    //   }
    // }

    

    let consommationNormal = trancheConsommationNormal[1] + trancheConsommationNormal[2] + trancheConsommationNormal[3] + trancheConsommationNormal[4]
    let consommationJour = (consommationNormal / 30).toFixed(2)
    let consommationHeure = (consommationJour / 24).toFixed(2)

    
    // calculer le prix normal par tranche
    let prixNormalTotalParTranche = {
      1 : trancheConsommationNormal[1] * prixParTranche[1],
      2 : trancheConsommationNormal[2] * prixParTranche[2],
      3 : trancheConsommationNormal[3] * prixParTranche[3],
      4 : trancheConsommationNormal[4] * prixParTranche[4]
    }
    let prixNormalTotal = prixNormalTotalParTranche[1] + prixNormalTotalParTranche[2] + prixNormalTotalParTranche[3] + prixNormalTotalParTranche[4]

    
    // calculer en TTC la consommation normale
    let prixTotalTTC = await CalculTKwhEnAriaryTTC(compteElectriciteEauId, min)
    if (prixTotalTTC.messageError) return res.status(400).json({ messageError: resultElectricite.messageError }); 


    // calculer en TTC la consommation normale
    let prixTTC = await CalculTKwhEnAriaryTTC(compteElectriciteEauId, consommationNormal)
    if (prixTTC.messageError) return res.status(400).json({ messageError: resultElectricite.messageError }); 

    


    let data = {
      Msg: Msg,
      min: min,
      consommationParTranche : consommationParTranche,
      prixTotalParTranche: prixTotalParTranche,
      prixTotal: prixTotal,
      prixTotalTTC: prixTotalTTC.data.prixTTC,
      valeurEconomiser : valeurEconomiser * 100,
      tranche: tranche,
      reduction: reduction,
      consommationNormal: consommationNormal,
      trancheConsommationNormal: trancheConsommationNormal,
      prixNormalTotalParTranche: prixNormalTotalParTranche,
      prixNormalTotal: prixNormalTotal,
      consommationJour: parseFloat(consommationJour),
      consommationHeure: parseFloat(consommationHeure),
      prixTTC: prixTTC.data.prixTTC
    }

    // console.log("data : ",data)
     return {data : data, success: true}

  } catch (error) {
    return { message: error.message, success: false };
  }
  
}


// Fonction pour calculerKwHEnAriary
export async function CalculTKwhEnAriaryTTC(compteElectriciteEauId, Kwh, status, device_id) {
  try {
    let totalCompteHybride = 0
    // Kwh = 60
    let tva_hybride = 0
    if(status === "hybride"){

      // compter le nombre du kit hybride sur le compteur
      let compteur = await prisma.kitTongouUser.findMany({
        where: {
          AND:[
            { compteElectriciteEauId: parseInt(compteElectriciteEauId) },
            { KitTongou: {
              kitTypeId : 3
            }}
          ]
        },
      });
      totalCompteHybride = compteur.length

      // trouver le kit principale
      let kitTongou = await prisma.kitTongouUser.findFirst({
        where: {
          AND:[
            { compteElectriciteEauId: parseInt(compteElectriciteEauId) },
            { KitTongou: {
              kitTypeId : 1
            }}
          ]
        }, include: {
          KitTongou: true,
          CompteElectriciteEau: true
        }
      });
      let dateNow = new Date();
      // console.log("kitTongou.KitTongou.idKitTongou : ",kitTongou.KitTongou.idKitTongou)
      let rep_consommation_mois = await getConsommationKitTongouMois(kitTongou.KitTongou.idKitTongou , parseInt(compteElectriciteEauId), kitTongou.CompteElectriciteEau.dateReleve, dateNow);
      // console.log("rep_consommation_mois principale : ",rep_consommation_mois.data.tva);
      tva_hybride = rep_consommation_mois.data.tva
    }


    const existingCompteElectriciteEauUser = await prisma.compteElectriciteEau.findUnique({
      where: {
          id: parseInt(compteElectriciteEauId)
      }
    });
    if (!existingCompteElectriciteEauUser) return res.status(404).json({ messageError: "Ce compte n'existe pas!" });
    // console.log("existingCompteElectriciteEauUser", existingCompteElectriciteEauUser)
    
         

    let kwhConsomme = Kwh
    // console.log("Kwh : ",Kwh);
    // console.log("kwhConsomme : ",kwhConsomme);
    let tourneId = existingCompteElectriciteEauUser.referenceClient
    let communeId = existingCompteElectriciteEauUser.communeClient.toString()
    let zoneId = existingCompteElectriciteEauUser.zoneId
    let tarif = existingCompteElectriciteEauUser.tarif
    let puissance = existingCompteElectriciteEauUser.puissance
    
    const prix = await prisma.prix.findFirst({
      where: {
        AND: [
          { zoneId: zoneId },
          { tarif: tarif }
        ]
      }
    });
    
    const tourneSlice = tourneId.slice(0, 7)

    const agence = await prisma.agence.findFirst({
      where:{
        AND:[
          {tourneId : tourneSlice},
          {communeId : parseInt(communeId)}
        ]
      },
    })

  if (!agence) return { messageError: "Réference client introuvable" };

    let  quantiteParTranche = {
      1 : prix.q1,
      2 : prix.q2,
      3 : prix.q3,
      4 : prix.q4
    }

    let prixParTranche = {
        1 : prix.p1,
        2 : prix.p2,
        3 : prix.p3,
        4 : prix.p4
    
    }


    let consommationParTranche = {
      1 : 0.0,
      2 : 0.0,
      3 : 0.0,
      4 : 0.0
    }

    let prixTotalParTranche = {
      1 : 0.0,
      2 : 0.0,
      3 : 0.0,
      4 : 0.0
    }
    let valid = false
    let i = 1


    while( valid === false){
      if(kwhConsomme > quantiteParTranche[i]){
        kwhConsomme = kwhConsomme - quantiteParTranche[i]
        consommationParTranche[i] = quantiteParTranche[i]
        prixTotalParTranche[i] = quantiteParTranche[i] * prixParTranche[i]
      }else{
        consommationParTranche[i] = kwhConsomme
        prixTotalParTranche[i] = kwhConsomme * prixParTranche[i]
        
        valid = true
      }
      i ++
    }
    let prixTotal = 0

    // modification indiceTranche
   
    

    if(status !== "hybride") prixTotal = prixTotalParTranche[1] + prixTotalParTranche[2] + prixTotalParTranche[3] + prixTotalParTranche[4]
    else {
      // trouver kit tongou par device_id
      if(!device_id) return { messageError: 'device_id manquante' };
      let kitTongou = await prisma.kitTongou.findFirst({
        where: {
          idKitTongou: device_id
        }
      });

      // trouver KitTongouLimiteHybride par id kit
      let kitTongouLimiteHybride = await prisma.kitTongouLimiteHybride.findFirst({
        where: {
          kitTongouId: kitTongou.id
        }
      });
      let tranche1 = kitTongouLimiteHybride.tranche1
      let tranche2 = kitTongouLimiteHybride.tranche2

      consommationParTranche = {
        1 : Kwh,
        2 : 0.0,
        3 : 0.0,
        4 : 0.0
      }

      if(tranche2 > 0){
        consommationParTranche[1] = tranche1
        consommationParTranche[2] = tranche2
        consommationParTranche[3] = Kwh - (tranche2 + tranche1)
      }else if(tranche1 > 0){
        consommationParTranche[1] = tranche1
        consommationParTranche[2] = Kwh - tranche1
      }

      prixTotalParTranche = {
        1 : consommationParTranche[1] * prixParTranche[1],
        2 : consommationParTranche[2] * prixParTranche[2],
        3 : consommationParTranche[3] * prixParTranche[3],
        4 : consommationParTranche[4] * prixParTranche[4]
      }

      prixTotal = prixTotalParTranche[1] + prixTotalParTranche[2] + prixTotalParTranche[3] + prixTotalParTranche[4]
    }
    
    // console.log("consommationParTranche : ",consommationParTranche);
    // console.log("prixTotalParTranche : ",prixTotalParTranche);
    // console.log(("prixTotal : ",prixTotal));

    
    let prime = status === "hybride" ? prix.prime / totalCompteHybride : prix.prime;
    let redevance = status === "hybride" ? prix.redevance / totalCompteHybride : prix.redevance;
    // let prime =  prix.prime;
    // let redevance = prix.redevance;
    let prixKwhTotal = prixTotalParTranche[1] + prixTotalParTranche[2] + prixTotalParTranche[3] + prixTotalParTranche[4] 
    let primeTotal = prime * puissance

    // let primeTotal2 = prix.prime * puissance
    // console.log("prime : ",prix.prime);
    // console.log("redevance : ",prix.redevance);
    // console.log("primeTotal2 : ",primeTotal2);
        
    
    /**
     * SOUS TOTAL JIRAMA
     */
    let sousTotalJirama = prixKwhTotal + redevance + primeTotal
    // console.log("sousTotalJirama : ",sousTotalJirama);
    
        
    /**
     * TAXE COMMUNALE
     **/ 
    
    const taxe = await prisma.taxe.findFirst({
      where: {
        AND: [
          { site: agence.agenceCode },
          { communeId: communeId },
          { activite: existingCompteElectriciteEauUser.activite }
        ]
      }
    })

    let taxe_communale_prix = taxe.taxe_communale / 100
    // let taxe_communale_prix = status === "hybride" ? (taxe.taxe_communale / 100) / totalCompteHybride : taxe.taxe_communale / 100
    // console.log("taxe_communale_prix : ",taxe_communale_prix);

    let taxe_communale_tranche = {
      1 : 0,
      2 : 0,
      3 : 0,
      4 : 0
    }
        
    if(taxe.type_taxe === 1){
      taxe_communale_tranche = {
        1 : prixTotalParTranche[1] * taxe_communale_prix,
        2 : prixTotalParTranche[2] * taxe_communale_prix,
        3 : prixTotalParTranche[3] * taxe_communale_prix,
        4 : prixTotalParTranche[4] * taxe_communale_prix
      }
    }else if (taxe.type_taxe === 2){
      taxe_communale_tranche = {
        1 : consommationParTranche[1] * taxe.taxe_communale,
        2 : consommationParTranche[2] * taxe.taxe_communale,
        3 : consommationParTranche[3] * taxe.taxe_communale,
        4 : consommationParTranche[4] * taxe.taxe_communale
      }
    }
    
    let taxe_communale = taxe_communale_tranche[1] + taxe_communale_tranche[2] + taxe_communale_tranche[3] + taxe_communale_tranche[4]
    // console.log("taxe_communale : ",taxe_communale);
    
    
    /**
     * SURTAXE COMMUNALE
     **/ 
    let surtaxe_prix = taxe.surtaxe / 100
    // let surtaxe_prix = status === "hybride" ? (taxe.surtaxe / 100) / totalCompteHybride : taxe.surtaxe / 100
    
    let surtaxe_tranche = {
      1 : 0,
      2 : 0,
      3 : 0,
      4 : 0
    }    
    if(taxe.type_surtaxe === 1){
      surtaxe_tranche = {
        1 : prixTotalParTranche[1] * surtaxe_prix,
        2 : prixTotalParTranche[2] * surtaxe_prix,
        3 : prixTotalParTranche[3] * surtaxe_prix,
        4 : prixTotalParTranche[4] * surtaxe_prix
      }
    }else if (taxe.type_surtaxe === 2){
      surtaxe_tranche = {
        1 : consommationParTranche[1] * taxe.surtaxe,
        2 : consommationParTranche[2] * taxe.surtaxe,
        3 : consommationParTranche[3] * taxe.surtaxe,
        4 : consommationParTranche[4] * taxe.surtaxe
      }
    }

    let surtaxe = surtaxe_tranche[1] + surtaxe_tranche[2] + surtaxe_tranche[3] + surtaxe_tranche[4]
    // console.log("surtaxe : ",surtaxe);
    

    /**
     * FNE
     **/ 
    const fne = await prisma.fne.findUnique({
      where:{
        tarif : tarif
      }
    })
    let fne_tranche = {
      1 : prixTotalParTranche[1] * fne.t1,
      2 : prixTotalParTranche[2] * fne.t2,
      3 : prixTotalParTranche[3] * fne.t3,
      4 : prixTotalParTranche[4] * fne.t4
    }
    let fne_taxe = fne_tranche[1] + fne_tranche[2] + fne_tranche[3] + fne_tranche[4]
    fne_taxe = fne_taxe / 100
    // fne_taxe = status === "hybride" ? (fne_taxe / 100) / totalCompteHybride : fne_taxe / 100
        
    /**
     * TAXE
     */
    let tva_ = 0
    let tva_value = 0.2
    let type = existingCompteElectriciteEauUser.categorie

    // si tva est frappé partiellement
    if(type === "partiel"){
        // si votre tarif est 10 la total du consommation devrait > 100kwh
        if(parseInt(tarif) === 10){
          if(consommationParTranche[2] > 50){
            let tvaParTranche = {
              1 : 0,
              2 : ((consommationParTranche[2] - 50) * prixParTranche[2]) * tva_value,
              3 : prixTotalParTranche[3] * tva_value,
              4 : prixTotalParTranche[4] * tva_value,
              5 : taxe_communale * tva_value,
              6 : surtaxe * tva_value,
              7 : fne_taxe * tva_value,
              8 : redevance * tva_value,
              9 : primeTotal * tva_value,
            }
            tva_ = tvaParTranche[1] + tvaParTranche[2] + tvaParTranche[3] + tvaParTranche[4] + tvaParTranche[5] + tvaParTranche[6] + tvaParTranche[7] + tvaParTranche[8] + tvaParTranche[9]
          }

        // si tarif est > 10 calcul de tva normal 
        }else{
          let tvaParTranche = {
            1 : ((consommationParTranche[1] - 100) * prixParTranche[1]) * tva_value,
            2 : prixTotalParTranche[2] * tva_value,
            3 : prixTotalParTranche[3] * tva_value,
            4 : prixTotalParTranche[4] * tva_value,
            5 : taxe_communale * tva_value,
            6 : surtaxe * tva_value,
            7 : fne_taxe * tva_value,
            8 : redevance * tva_value,
            9 : primeTotal * tva_value,
          }
          tva_ = tvaParTranche[1] + tvaParTranche[2] + tvaParTranche[3] + tvaParTranche[4] + tvaParTranche[5] + tvaParTranche[6] + tvaParTranche[7] + tvaParTranche[8] + tvaParTranche[9]
        }
  
    // si tva est frappé totalement, tout est taxé 
    }else if(type === "total"){
      let tvaParTranche = {
        1 : prixTotalParTranche[1] * tva_value,
        2 : prixTotalParTranche[2] * tva_value,
        3 : prixTotalParTranche[3] * tva_value,
        4 : prixTotalParTranche[4] * tva_value,
        5 : taxe_communale * tva_value,
        6 : surtaxe * tva_value,
        7 : fne_taxe * tva_value,
        8 : redevance * tva_value,
        9 : primeTotal * tva_value,
      }
      tva_ = tvaParTranche[1] + tvaParTranche[2] + tvaParTranche[3] + tvaParTranche[4] + tvaParTranche[5] + tvaParTranche[6] + tvaParTranche[7] + tvaParTranche[8] + tvaParTranche[9]
    }else if(type === "exonoré"){
        tva_ = 0
    }
    
    let prix_net = 0

    if(status === "hybride"){
      tva_hybride = tva_hybride / totalCompteHybride
      prix_net = sousTotalJirama + taxe_communale + surtaxe + fne_taxe + tva_hybride
    }else{
      prix_net = sousTotalJirama + taxe_communale + surtaxe + fne_taxe + tva_
    }
    
        

    /**
     * PRIX NET
     */
    // console.log("sousTotalJirama : ",sousTotalJirama);
    // console.log("taxe_communale : ",taxe_communale);
    // console.log("surtaxe : ",surtaxe);
    // console.log("fne_taxe : ",fne_taxe);
    // console.log("tva_ : ",tva_);
    


    
    let data = {
      consommation: Kwh,
      consommationParTranche : consommationParTranche,
      prixTotalParTranche: prixTotalParTranche,
      prixTotalTranche: parseFloat(prixTotal),
      sousTotalJirama,
      taxe_communale,
      surtaxe,
      fne_taxe,
      tva_,
      prixTTC : parseFloat(prix_net),
      // prixTotalTranche: parseFloat(prixTotal.toFixed(2)),
      // prixTTC : parseFloat(prix_net.toFixed(2)),
    }

    // console.log("data : ",data)
    
     return {data : data}

  } catch (error) {
    return { messageError: 'Erreur serveur' };
  }
  
}


export async function CalculTKwhParTranche(compteElectriciteEauId, Kwh) {
  try {

    const existingCompteElectriciteEauUser = await prisma.compteElectriciteEau.findUnique({
      where: {
          id: parseInt(compteElectriciteEauId)
      }
    });
    if (!existingCompteElectriciteEauUser) return res.status(404).json({ messageError: "Ce compte n'existe pas!" });
    // console.log("existingCompteElectriciteEauUser", existingCompteElectriciteEauUser)
    
         

    let kwhConsomme = Kwh
    let tourneId = existingCompteElectriciteEauUser.referenceClient
    let communeId = existingCompteElectriciteEauUser.communeClient.toString()
    let zoneId = existingCompteElectriciteEauUser.zoneId
    let tarif = existingCompteElectriciteEauUser.tarif
    
    const prix = await prisma.prix.findFirst({
      where: {
        AND: [
          { zoneId: zoneId },
          { tarif: tarif }
        ]
      }
    });
    
    const tourneSlice = tourneId.slice(0, 7)

    const agence = await prisma.agence.findFirst({
      where:{
        AND:[
          {tourneId : tourneSlice},
          {communeId : parseInt(communeId)}
        ]
      },
    })

  if (!agence) return { messageError: "Réference client introuvable" };

    let prixParTranche = {
        1 : prix.p1,
        2 : prix.p2,
        3 : prix.p3,
        4 : prix.p4
    
    }

    let indiceTrance = existingCompteElectriciteEauUser.indiceTrance
    let prixTotal = kwhConsomme * prixParTranche[indiceTrance]
    
    
    
    let data = {
      consommation: Kwh,
      prixTotalTranche: parseFloat(prixTotal),
    }

    // console.log("data : ",data)
    
     return {data : data}

  } catch (error) {
    console.error("Erreur lors du calcul du prix par tranche :", error);
    return { messageError:`Erreur lors du calcul du prix par tranche, ${error.message}` };
  }
  
}


export async function CalculKwhParIndiceTranche(compteElectriciteEauId, Kwh, indiceTranche) {
  try {

    const existingCompteElectriciteEauUser = await prisma.compteElectriciteEau.findUnique({
      where: {
          id: parseInt(compteElectriciteEauId)
      }
    });
    if (!existingCompteElectriciteEauUser) return res.status(404).json({ messageError: "Ce compte n'existe pas!" });
    // console.log("existingCompteElectriciteEauUser", existingCompteElectriciteEauUser)
    
         

    let kwhConsomme = Kwh
    let tourneId = existingCompteElectriciteEauUser.referenceClient
    let communeId = existingCompteElectriciteEauUser.communeClient.toString()
    let zoneId = existingCompteElectriciteEauUser.zoneId
    let tarif = existingCompteElectriciteEauUser.tarif
    
    const prix = await prisma.prix.findFirst({
      where: {
        AND: [
          { zoneId: zoneId },
          { tarif: tarif }
        ]
      }
    });
    
    const tourneSlice = tourneId.slice(0, 7)

    const agence = await prisma.agence.findFirst({
      where:{
        AND:[
          {tourneId : tourneSlice},
          {communeId : parseInt(communeId)}
        ]
      },
    })

  if (!agence) return { messageError: "Réference client introuvable" };

    let prixParTranche = {
        1 : prix.p1,
        2 : prix.p2,
        3 : prix.p3,
        4 : prix.p4
    
    }

    let prixTotal = kwhConsomme * prixParTranche[indiceTranche]
    
    
    
    let data = {
      consommation: Kwh,
      prixTotalTranche: parseFloat(prixTotal),
    }

    // console.log("data : ",data)
    
     return {data : data}

  } catch (error) {
    console.error("Erreur lors du calcul du prix par tranche :", error);
    return { messageError:`Erreur lors du calcul du prix par tranche, ${error.message}` };
  }
  
}


export async function CalculKwhTrancheParGraph(compteElectriciteEauId, Kwh, KwhMoisReference) {
  try {

    const existingCompteElectriciteEauUser = await prisma.compteElectriciteEau.findUnique({
      where: {
          id: parseInt(compteElectriciteEauId)
      }
    });
    if (!existingCompteElectriciteEauUser) return res.status(404).json({ messageError: "Ce compte n'existe pas!" });
    // console.log("existingCompteElectriciteEauUser", existingCompteElectriciteEauUser)
    
         

    let kwhConsomme = Kwh
    let tourneId = existingCompteElectriciteEauUser.referenceClient
    let communeId = existingCompteElectriciteEauUser.communeClient.toString()
    let zoneId = existingCompteElectriciteEauUser.zoneId
    let tarif = existingCompteElectriciteEauUser.tarif
    
    const prix = await prisma.prix.findFirst({
      where: {
        AND: [
          { zoneId: zoneId },
          { tarif: tarif }
        ]
      }
    });
    
    const tourneSlice = tourneId.slice(0, 7)

    const agence = await prisma.agence.findFirst({
      where:{
        AND:[
          {tourneId : tourneSlice},
          {communeId : parseInt(communeId)}
        ]
      },
    })

  if (!agence) return { messageError: "Réference client introuvable" };

    let prixParTranche = {
        1 : prix.p1,
        2 : prix.p2,
        3 : prix.p3,
        4 : prix.p4
    }

    let quantiteParTranche = {
        1 : prix.q1,
        2 : prix.q2,
        3 : prix.q3,
        4 : prix.q4
    }

    // console.log(quantiteParTranche );
    // KwhMoisReference = KwhMoisReference + K

    let prixTotal = 0
    let indiceTrance = 1

    //      if(KwhMoisReference <= quantiteParTranche[1]) prixTotal = kwhConsomme * prixParTranche[1]
    // else if(KwhMoisReference <= quantiteParTranche[2]) prixTotal = kwhConsomme * prixParTranche[2], indiceTrance = 2
    // else if(KwhMoisReference <= quantiteParTranche[3]) prixTotal = kwhConsomme * prixParTranche[3], indiceTrance = 3

    if(KwhMoisReference <= quantiteParTranche[1]) {
      prixTotal = kwhConsomme * prixParTranche[1]
    }else{
      KwhMoisReference = KwhMoisReference - quantiteParTranche[1]
      if(KwhMoisReference <= quantiteParTranche[2]) prixTotal = kwhConsomme * prixParTranche[2], indiceTrance = 2
      else prixTotal = kwhConsomme * prixParTranche[3], indiceTrance = 3
    }



    // let prixTotal = kwhConsomme * prixParTranche[indiceTrance]
    
    
    
    let data = {
      consommation: Kwh,
      prixTotalTranche: parseFloat(prixTotal),
      indiceTranche: indiceTrance
    }

    // console.log("data : ",data)
    
     return {data : data}

  } catch (error) {
    console.error("Erreur lors du calcul du prix par tranche :", error);
    return { messageError:`Erreur lors du calcul du prix par tranche, ${error.message}` };
  }
  
}




export const CalculTKwhEnAriaryTTCBody = async(req, res) =>{
  try {

      const { compteElectriciteEauId, Kwh } = req.body;
      
      const compteElectricite = await prisma.compteElectriciteEau.findUnique({
        where: {
            id: parseInt(compteElectriciteEauId)
        }
      });
      if (!compteElectricite) return res.status(404).json({ messageError: "Ce compte n'existe pas!" });
      

      

      let tourneId = compteElectricite.referenceClient
      let communeId = compteElectricite.communeClient.toString()
      let tarif = compteElectricite.tarif
      let puissance = compteElectricite.puissance
      let type = compteElectricite.categorie

      let facture = {}
      
      // ELECTRICITE
      const resultElectricite = await functionCalculElectricite(tourneId, communeId, tarif, Kwh.toString(), "0", puissance, type);
        
      if (resultElectricite.messageError)  return res.status(400).json({ messageError: resultElectricite.messageError });

      const electricite = {
        tarifElectricite : resultElectricite.facture.tarif,
        puissance : resultElectricite.facture.puissance,
        nouvelElectricite : resultElectricite.facture.nouvel,
        ancienElectricite : resultElectricite.facture.ancien,
        consommationElectricite : resultElectricite.facture.consommation,
        prixParTrancheElectricite : resultElectricite.facture.prixTotalParTranche,
        consommationParTrancheElectricite : resultElectricite.facture.consommationParTranche,
        prixTotalParTrancheElectricite : resultElectricite.facture.prixTotalParTranche,
        primeElectricite : resultElectricite.facture.prime,
        redevanceElectricite : resultElectricite.facture.redevance,
        taxe_communaleElectricite : resultElectricite.facture.taxe_communale,
        surtaxeElectricite : resultElectricite.facture.surtaxe,
        fne : resultElectricite.facture.fne,
        tvaElecitricte : resultElectricite.facture.tva,
        prixTranche : resultElectricite.facture.prixTranche,
        prix_net_electricite : resultElectricite.facture.prix_net
      }

      facture = {
        reference_client : tourneId,
        categorie : resultElectricite.facture.categorie,
        agence : resultElectricite.facture.agence,
        commune : resultElectricite.facture.commune,
        province : resultElectricite.facture.province,
        electricite : electricite,
        prixTranche : parseInt(parseFloat(electricite.prixTranche).toFixed(2)),
        prixTotalNet : (parseFloat(electricite.prix_net_electricite)).toFixed(2)
      } 

     
      res.status(201).json({ facture : facture, statusDisjoncteur : compteElectricite.statusDisjoncteur, success: true })
   
  } catch (error) {
    res.status(500).json({ messageError: error.message, success: false });
  }
}


