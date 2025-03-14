import { PrismaClient } from '@prisma/client'
import jwt from "jsonwebtoken";

const prisma = new PrismaClient()



export const calculElectriciteUser = async(req, res) =>{
  try {
      const {nouvel, ancien} = req.body
      const {nouvelEau, ancienEau} = req.body

      const token = req.body.token;
      const idCompte = req.body.idCompte;

      if (!token) return res.json({ messageError: 'Token manquant, veuillez reconnecter' });

      const decodedToken = jwt.decode(token);  
      if (!decodedToken || !decodedToken.user) return res.json({ messageError: 'Token invalide' });

    
     
      // GET COMPTE 
      const compteElectricite = await prisma.compteElectriciteEau.findUnique({
          where:{
            id : parseInt(idCompte)
          },
          include: {
              Utilisateur: true
          },
      })
      if (!compteElectricite) return res.json({ messageError: "Vous n'avez pas du compte électricité!" });

   

      let tourneId = compteElectricite.referenceClient
      let communeId = compteElectricite.communeClient.toString()
      let tarif = compteElectricite.tarif
      let puissance = compteElectricite.puissance
      let type = compteElectricite.categorie
      let tarifEau = compteElectricite.tarifEau
      let calibrage = compteElectricite.calibrage

      let facture = {}

      if(compteElectricite.compteurElectricite && compteElectricite.compteurEau){

        // GET LAST CALCUL BY COMPTE ELECTRICITE EAU
        const calcul = await prisma.calculElectriciteEau.findFirst({
          where:{
            compteElectriciteEauId : parseInt(idCompte)
          },
          orderBy: {
            id: 'desc'
          }
        })

        let resultElectricite = []
        let resultEau = []

        if(calcul){
          resultElectricite = await functionCalculElectricite(tourneId, communeId, tarif, nouvel, (calcul.nouvelElectricite).toString(), puissance, type);
          resultEau = await functionCalculEau(tourneId, communeId, tarifEau, nouvelEau, (calcul.nouvelEau).toString(), calibrage, type);
        }else{
          resultElectricite = await functionCalculElectricite(tourneId, communeId, tarif, nouvel, ancien, puissance, type);
          resultEau = await functionCalculEau(tourneId, communeId, tarifEau, nouvelEau, ancienEau, calibrage, type);
        }
        if (resultElectricite.messageError)  return res.status(400).json({ messageError: resultElectricite.messageError });
        if (resultEau.messageError) return res.status(400).json({ messageError: resultEau.messageError });


        const electricite = {
          tarifElectricite : resultElectricite.facture.tarif,
          puissance : resultElectricite.facture.puissance,
          nouvelElectricite : resultElectricite.facture.nouvel,
          ancienElectricite : resultElectricite.facture.ancien,
          consommationElectricite : resultElectricite.facture.consommation,
          prixParTrancheElectricite : resultElectricite.facture.prixParTranche,
          consommationParTrancheElectricite : resultElectricite.facture.consommationParTranche,
          prixTotalParTrancheElectricite : resultElectricite.facture.prixTotalParTranche,
          primeElectricite : resultElectricite.facture.prime,
          redevanceElectricite : resultElectricite.facture.redevance,
          taxe_communaleElectricite : resultElectricite.facture.taxe_communale,
          surtaxeElectricite : resultElectricite.facture.surtaxe,
          fne : resultElectricite.facture.fne,
          tvaElecitricte : resultElectricite.facture.tva,
          prix_net_electricite : resultElectricite.facture.prix_net
        }    

        const eau = {
          tarifEau : resultEau.facture.tarifEau,
          calibrage : resultEau.facture.calibrage,
          nouvelEau : resultEau.facture.nouvel,
          ancienEau : resultEau.facture.ancien,
          consommationEau : resultEau.facture.consommation,
          prixParTrancheEau : resultEau.facture.prixParTranche,
          consommationParTrancheEau : resultEau.facture.consommationParTranche,
          prixTotalParTrancheEau : resultEau.facture.prixTotalParTranche,
          primeEau : resultEau.facture.prime,
          redevanceEau : resultEau.facture.redevance,
          taxe_communale_eau : resultEau.facture.taxe_communale,
          surtaxeEau : resultEau.facture.surtaxe,
          redevance_eau_usee_taxe : resultEau.facture.redevance_eau_usee_taxe,
          tva_eau : resultEau.facture.tva,
          prix_net_eau : resultEau.facture.prix_net
        }

        facture = {
          reference_client : tourneId,
          categorie : resultElectricite.facture.categorie,
          agence : resultElectricite.facture.agence,
          commune : resultElectricite.facture.commune,
          electricite : electricite,
          eau : eau,
          prixTotalNet : (parseFloat(electricite.prix_net_electricite) + parseFloat(eau.prix_net_eau) + 1000.34).toFixed(2)
        } 

        const compteElectriciteEauId = parseInt(idCompte)
        const prixElectricite = (parseFloat(electricite.prix_net_electricite+ 1000.34).toFixed(2))
        const prixEau = (parseFloat(eau.prix_net_eau+ 1000.34).toFixed(2))
        const consommationElectricite = electricite.consommationElectricite
        const consommationEau = eau.consommationEau
        const total = prixElectricite + prixEau

        if (calcul) {
          const now = new Date();
          const lastCalculDate = new Date(calcul.createdAt);
        
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(now.getMonth() - 1);
        
          if (lastCalculDate <= oneMonthAgo) {
            await prisma.calculElectriciteEau.create({
              data: {
                compteElectriciteEauId,
                prixElectricite: parseFloat(prixElectricite),
                prixEau: parseFloat(prixEau),
                consommationElectricite,
                consommationEau,
                total: parseFloat(total),
                primeElectricite: electricite.primeElectricite,
                redevanceElectricite: electricite.redevanceElectricite,
                taxe_communaleElectricite: electricite.taxe_communaleElectricite,
                surtaxeElectricite: electricite.surtaxeElectricite,
                fneElectricite: electricite.fne,
                tvaElectricite: electricite.tvaElecitricte,
                primeEau: eau.primeEau,
                redevanceEau: eau.redevanceEau,
                taxe_communaleEau: eau.taxe_communale_eau,
                surtaxeEau: eau.surtaxeEau,
                redevance_eau_usee_taxe: eau.redevance_eau_usee_taxe,
                tva_eau: eau.tva_eau,
                nouvelElectricite: electricite.nouvelElectricite,
                ancienElectricite: electricite.ancienElectricite,
                nouvelEau: eau.nouvelEau,
                ancienEau: eau.ancienEau,
              },
            });
            } 
        } else {
          
          // S'il n'y a pas de calcul précédent, exécuter le saveCalcul
          await prisma.calculElectriciteEau.create({
            data: {
              compteElectriciteEauId,
              prixElectricite: parseFloat(prixElectricite),
              prixEau: parseFloat(prixEau),
              consommationElectricite,
              consommationEau,
              total: parseFloat(total),
              primeElectricite: electricite.primeElectricite,
              redevanceElectricite: electricite.redevanceElectricite,
              taxe_communaleElectricite: electricite.taxe_communaleElectricite,
              surtaxeElectricite: electricite.surtaxeElectricite,
              fneElectricite: electricite.fne,
              tvaElectricite: electricite.tvaElecitricte,
              primeEau: eau.primeEau,
              redevanceEau: eau.redevanceEau,
              taxe_communaleEau: eau.taxe_communale_eau,
              surtaxeEau: eau.surtaxeEau,
              redevance_eau_usee_taxe: eau.redevance_eau_usee_taxe,
              tva_eau: eau.tva_eau,
              nouvelElectricite: electricite.nouvelElectricite,
              ancienElectricite: electricite.ancienElectricite,
              nouvelEau: eau.nouvelEau,
              ancienEau: eau.ancienEau,
            },
          });
        }
      
      }else if(compteElectricite.compteurElectricite){
        // ELECTRICITE

        // GET LAST CALCUL BY COMPTE ELECTRICITE EAU
        const calcul = await prisma.calculElectriciteEau.findFirst({
          where:{
            compteElectriciteEauId : parseInt(idCompte)
          },
          orderBy: {
            id: 'desc'
          }
        })

        let resultElectricite = []
        if(calcul){

          resultElectricite = await functionCalculElectricite(tourneId, communeId, tarif, nouvel, (calcul.ancienElectricite).toString(), puissance, type);
        }else{
          resultElectricite = await functionCalculElectricite(tourneId, communeId, tarif, nouvel, ancien, puissance, type);
        }
        
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
          prix_net_electricite : resultElectricite.facture.prix_net
        }

        facture = {
          reference_client : tourneId,
          categorie : resultElectricite.facture.categorie,
          agence : resultElectricite.facture.agence,
          commune : resultElectricite.facture.commune,
          electricite : electricite,
          prixTotalNet : (parseFloat(electricite.prix_net_electricite) + 1000.34).toFixed(2)
        } 

        const compteElectriciteEauId = parseInt(idCompte)
        const prixElectricite = (parseFloat(electricite.prix_net_electricite+ 1000.34).toFixed(2))
        const prixEau = 0
        const consommationElectricite = electricite.consommationElectricite
        const consommationEau = 0
        const total = prixElectricite

        if (calcul) {
          const now = new Date();
          const lastCalculDate = new Date(calcul.createdAt);
        
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(now.getMonth() - 1);
        
          if (lastCalculDate <= oneMonthAgo) {
            await prisma.calculElectriciteEau.create({
              data: {
                compteElectriciteEauId,
                prixElectricite: parseFloat(prixElectricite),
                prixEau,
                consommationElectricite,
                consommationEau,
                total: parseFloat(total),
                primeElectricite: electricite.primeElectricite,
                redevanceElectricite: electricite.redevanceElectricite,
                taxe_communaleElectricite: electricite.taxe_communaleElectricite,
                surtaxeElectricite: electricite.surtaxeElectricite,
                fneElectricite: electricite.fne,
                tvaElectricite: electricite.tvaElecitricte,
                primeEau: 0.0,
                redevanceEau: 0.0,
                taxe_communaleEau: 0.0,
                surtaxeEau: 0.0,
                redevance_eau_usee_taxe: 0.0,
                tva_eau: 0.0,
                nouvelElectricite: electricite.nouvelElectricite,
                ancienElectricite: electricite.ancienElectricite,
                nouvelEau: 0,
                ancienEau: 0,
              },
            });
            } 
        } else {
          // S'il n'y a pas de calcul précédent, exécuter le saveCalcul
          await prisma.calculElectriciteEau.create({
            data: {
              compteElectriciteEauId,
              prixElectricite: parseFloat(prixElectricite),
              prixEau,
              consommationElectricite,
              consommationEau,
              total: parseFloat(total),
              primeElectricite: electricite.primeElectricite,
              redevanceElectricite: electricite.redevanceElectricite,
              taxe_communaleElectricite: electricite.taxe_communaleElectricite,
              surtaxeElectricite: electricite.surtaxeElectricite,
              fneElectricite: electricite.fne,
              tvaElectricite: electricite.tvaElecitricte,
              primeEau: 0.0,
              redevanceEau: 0.0,
              taxe_communaleEau: 0.0,
              surtaxeEau: 0.0,
              redevance_eau_usee_taxe: 0.0,
              tva_eau: 0.0,
              nouvelElectricite: electricite.nouvelElectricite,
              ancienElectricite: electricite.ancienElectricite,
              nouvelEau: 0,
              ancienEau: 0,
            },
          });
        }

        

      
      
      
      }else if(compteElectricite.compteurEau){
        // EAU
        const resultEau = await functionCalculEau(tourneId, communeId, tarifEau, nouvelEau, ancienEau, calibrage, type);
        if (resultEau.messageError) return res.status(400).json({ messageError: resultEau.messageError });

        const eau = {
          tarifEau : resultEau.facture.tarifEau,
          calibrage : resultEau.facture.calibrage,
          nouvelEau : resultEau.facture.nouvel,
          ancienEau : resultEau.facture.ancien,
          consommationEau : resultEau.facture.consommation,
          prixParTrancheEau : resultEau.facture.prixParTranche,
          consommationParTrancheEau : resultEau.facture.consommationParTranche,
          prixTotalParTrancheEau : resultEau.facture.prixTotalParTranche,
          primeEau : resultEau.facture.prime,
          redevanceEau : resultEau.facture.redevance,
          taxe_communale_eau : resultEau.facture.taxe_communale,
          surtaxeEau : resultEau.facture.surtaxe,
          redevance_eau_usee_taxe : resultEau.facture.redevance_eau_usee_taxe,
          tva_eau : resultEau.facture.tva,
          prix_net_eau : resultEau.facture.prix_net
        }

        facture = {
          prixTotalNet :  (parseFloat(eau.prix_net_eau) + 1000.34).toFixed(2),
          reference_client : tourneId,
          categorie : resultEau.facture.categorie,
          agence : resultEau.facture.agence,
          commune : resultEau.facture.commune,
          eau : eau
        } 

      }
     
      res.json({ facture : facture })
   
  } catch (error) {
    res.status(500).json({ messageError: 'Erreur serveur' });
  }
}


export const calculElectriciteUserChoix = async(req, res) =>{
  try {
      const {nouvel, ancien} = req.body
      const {nouvelEau, ancienEau} = req.body
      const choix1 = req.body.choix
      const choix = choix1.toLowerCase()

      const token = req.body.token;
      const idCompte = req.body.idCompte;

      if (!token) return res.status(400).json({ messageError: 'Token manquant, veuillez reconnecter', success: false });

      const decodedToken = jwt.decode(token);  
      if (!decodedToken || !decodedToken.user) return res.status(400).json({ messageError: 'Token invalide', success: false });


      // GET COMPTE 
      const compteElectricite = await prisma.compteElectriciteEau.findUnique({
          where:{
            id : parseInt(idCompte)
          },
          include: {
              Utilisateur: true
          },
      })
      if (!compteElectricite) return res.status(400).json({ messageError: "Vous n'avez pas du compte électricité!", success: false });
      // console.log("compteElectricite", compteElectricite);
      
      

      let tourneId = compteElectricite.referenceClient
      let communeId = compteElectricite.communeClient.toString()
      let tarif = compteElectricite.tarif
      let puissance = compteElectricite.puissance
      let type = compteElectricite.categorie
      let tarifEau = compteElectricite.tarifEau
      let calibrage = compteElectricite.calibrage

      let facture = {}
      
      if(choix === 'electricite'){
        if(compteElectricite.compteurElectricite === '') return res.status(400).json({messageError: "Vous n'avez pas du compte électricité", success: false})
         
        // ELECTRICITE
        const resultElectricite = await functionCalculElectricite(tourneId, communeId, tarif, nouvel, ancien, puissance, type);
        
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

      
      }else if(choix === 'eau'){
        if(compteElectricite.compteurEau === '') return res.status(400).json({messageError: "Vous n'avez pas du compte eau", success: false})
        
        // EAU
        const resultEau = await functionCalculEau(tourneId, communeId, tarifEau, nouvelEau, ancienEau, calibrage, type);
        if (resultEau.messageError) return res.status(400).json({ messageError: resultEau.messageError });

        const eau = {
          tarifEau : resultEau.facture.tarifEau,
          calibrage : resultEau.facture.calibrage,
          nouvelEau : resultEau.facture.nouvel,
          ancienEau : resultEau.facture.ancien,
          consommationEau : resultEau.facture.consommation,
          prixParTrancheEau : resultEau.facture.prixParTranche,
          consommationParTrancheEau : resultEau.facture.consommationParTranche,
          prixTotalParTrancheEau : resultEau.facture.prixTotalParTranche,
          primeEau : resultEau.facture.prime,
          redevanceEau : resultEau.facture.redevance,
          taxe_communale_eau : resultEau.facture.taxe_communale,
          surtaxeEau : resultEau.facture.surtaxe,
          redevance_eau_usee_taxe : resultEau.facture.redevance_eau_usee_taxe,
          tva_eau : resultEau.facture.tva,
          prixTranche : resultEau.facture.prixTranche,
          prix_net_eau : resultEau.facture.prix_net
        }

        facture = {
          prixTotalNet :  (parseFloat(eau.prix_net_eau)).toFixed(2),
          prixTranche : parseInt(parseFloat(eau.prixTranche).toFixed(2)),
          reference_client : tourneId,
          categorie : resultEau.facture.categorie,
          agence : resultEau.facture.agence,
          commune : resultEau.facture.commune,
          province : resultEau.facture.province,
          eau : eau
        } 

      }else{
        if(compteElectricite.compteurElectricite === '' || compteElectricite.compteurEau === ''){
          if(compteElectricite.compteurElectricite === '') return res.status(400).json({messageError: "Vous n'avez pas du compte électricité", success: false})
          else if(compteElectricite.compteurEau === '') return res.status(400).json({messageError: "Vous n'avez pas du compte eau", success: false})
        }

         // ELECTRICITE
         const resultElectricite = await functionCalculElectricite(tourneId, communeId, tarif, nouvel, ancien, puissance, type);
         if (resultElectricite.messageError)  return res.status(400).json({ messageError: resultElectricite.messageError });
 
         const electricite = {
           tarifElectricite : resultElectricite.facture.tarif,
           puissance : resultElectricite.facture.puissance,
           nouvelElectricite : resultElectricite.facture.nouvel,
           ancienElectricite : resultElectricite.facture.ancien,
           consommationElectricite : resultElectricite.facture.consommation,
           prixParTrancheElectricite : resultElectricite.facture.prixParTranche,
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
 
         // EAU
         const resultEau = await functionCalculEau(tourneId, communeId, tarifEau, nouvelEau, ancienEau, calibrage, type);
         if (resultEau.messageError) return res.status(400).json({ messageError: resultEau.messageError, success: false });
 
         const eau = {
           tarifEau : resultEau.facture.tarifEau,
           calibrage : resultEau.facture.calibrage,
           nouvelEau : resultEau.facture.nouvel,
           ancienEau : resultEau.facture.ancien,
           consommationEau : resultEau.facture.consommation,
           prixParTrancheEau : resultEau.facture.prixParTranche,
           consommationParTrancheEau : resultEau.facture.consommationParTranche,
           prixTotalParTrancheEau : resultEau.facture.prixTotalParTranche,
           primeEau : resultEau.facture.prime,
           redevanceEau : resultEau.facture.redevance,
           taxe_communale_eau : resultEau.facture.taxe_communale,
           surtaxeEau : resultEau.facture.surtaxe,
           redevance_eau_usee_taxe : resultEau.facture.redevance_eau_usee_taxe,
           tva_eau : resultEau.facture.tva,
           prixTranche : resultElectricite.facture.prixTranche,
           prix_net_eau : resultEau.facture.prix_net
         }
 
 
         facture = {
           reference_client : tourneId,
           categorie : resultElectricite.facture.categorie,
           agence : resultElectricite.facture.agence,
           commune : resultElectricite.facture.commune,
           province : resultElectricite.facture.province,
           electricite : electricite,
           eau : eau,
           prixTranche : parseInt((parseFloat(electricite.prixTranche) + parseFloat(eau.prixTranche)).toFixed(2)),
           prixTotalNet : (parseFloat(electricite.prix_net_electricite) + parseFloat(eau.prix_net_eau)).toFixed(2)
         } 
      }
     
      res.status(201).json({ facture : facture, statusDisjoncteur : compteElectricite.statusDisjoncteur, success: true })
   
  } catch (error) {
    res.status(500).json({ messageError: error.message, success: false });
  }
}


export const calculElectriciteEau = async(req, res) =>{
  try {
      const {tourneId, communeId, tarif, nouvel, ancien, puissance, type} = req.body
      const {tarifEau, nouvelEau, ancienEau, calibrage} = req.body
   

      const resultElectricite = await functionCalculElectricite(tourneId, communeId, tarif, nouvel, ancien, puissance, type);

      if (resultElectricite.messageError) {
        return res.status(400).json({ messageError: resultElectricite.messageError });
      }
  
      const resultEau = await functionCalculEau(tourneId, communeId, tarifEau, nouvelEau, ancienEau, calibrage, type);

      if (resultEau.messageError) {
        return res.status(400).json({ messageError: resultEau.messageError });
      }
  
    const electricite = {
      tarifElectricite : resultElectricite.facture.tarif,
      puissance : resultElectricite.facture.puissance,
      nouvelElectricite : resultElectricite.facture.nouvel,
      ancienElectricite : resultElectricite.facture.ancien,
      consommationElectricite : resultElectricite.facture.consommation,
      prixParTrancheElectricite : resultElectricite.facture.prixParTranche,
      consommationParTrancheElectricite : resultElectricite.facture.consommationParTranche,
      prixTotalParTrancheElectricite : resultElectricite.facture.prixTotalParTranche,
      primeElectricite : resultElectricite.facture.prime,
      redevanceElectricite : resultElectricite.facture.redevance,
      taxe_communaleElectricite : resultElectricite.facture.taxe_communale,
      surtaxeElectricite : resultElectricite.facture.surtaxe,
      fne : resultElectricite.facture.fne,
      tvaElecitricte : resultElectricite.facture.tva,
      prix_net_electricite : resultElectricite.facture.prix_net
    }

    const eau = {
      tarifEau : resultEau.facture.tarifEau,
      calibrage : resultEau.facture.calibrage,
      nouvelEau : resultEau.facture.nouvel,
      ancienEau : resultEau.facture.ancien,
      consommationEau : resultEau.facture.consommation,
      prixParTrancheEau : resultEau.facture.prixParTranche,
      consommationParTrancheEau : resultEau.facture.consommationParTranche,
      prixTotalParTrancheEau : resultEau.facture.prixTotalParTranche,
      primeEau : resultEau.facture.prime,
      redevanceEau : resultEau.facture.redevance,
      taxe_communale_eau : resultEau.facture.taxe_communale,
      surtaxeEau : resultEau.facture.surtaxe,
      redevance_eau_usee_taxe : resultEau.facture.redevance_eau_usee_taxe,
      tva_eau : resultEau.facture.tva,
      prix_net_eau : resultEau.facture.prix_net
    }

    let prixElectricite = parseFloat(electricite.prix_net_electricite)
    let prixEau = parseFloat(eau.prix_net_eau)
    let prixTotalNet = prixElectricite + prixEau + 1000.34
    
    const facture = {
      prixTotalNet : prixTotalNet.toFixed(2),
      reference_client : tourneId,
      categorie : resultElectricite.facture.categorie,
      agence : resultElectricite.facture.agence,
      commune : resultElectricite.facture.commune,
      province : resultElectricite.facture.province,
      electricite : electricite,
      eau : eau
    }      
    res.json({ 
      facture : facture
    })
   
  } catch (error) {
    res.status(500).json({ messageError: 'Erreur serveur' });
  }
}



export const calculElectricite = async(req, res) =>{
    try {
        const {tourneId, communeId, tarif, nouvel, ancien, puissance, type} = req.body

        
        const result = await functionCalculElectricite(tourneId, communeId, tarif, nouvel, ancien, puissance, type);

        if (result.messageError) {
          return res.status(400).json({ messageError: result.messageError });
        }
    
        // Modifier le prix_net en ajoutant 1000
        if (result.facture && result.facture.prix_net) {
          let prixNet = parseFloat(result.facture.prix_net);
          prixNet += 1000.34;
          result.facture.prix_net = prixNet.toFixed(2); 
        }

        res.json({ facture: result.facture });


        
     
    } catch (error) {
      res.status(500).json({ messageError: 'Erreur serveur' });
    }
}



export const calculEau = async(req, res) =>{ 
  try {
      const {tourneId, communeId, tarifEau, nouvel, ancien, calibrage, type} = req.body
      
      const result = await functionCalculEau(tourneId, communeId, tarifEau, nouvel, ancien, calibrage, type);

      if (result.messageError) {
        return res.status(400).json({ messageError: result.messageError });
      }
  
      // Modifier le prix_net en ajoutant 1000
      if (result.facture && result.facture.prix_net) {
        let prixNet = parseFloat(result.facture.prix_net);
        prixNet += 1000.34;
        result.facture.prix_net = prixNet.toFixed(2); 
      }

      res.json({ facture: result.facture });
   
  
    } catch (errors) {
    res.status(500).json({ messageError: 'Erreur serveur' });
  }
}


function convertDecimal(input) {
  // Convertir l'entrée en chaîne de caractères si ce n'est pas déjà le cas
  let cleanInput = input.toString().trim();

  // Remplacer les virgules par des points
  cleanInput = cleanInput.replace(',', '.');

  // Convertir en nombre flottant
  const parsedValue = parseFloat(cleanInput);

  // Retourner la valeur numérique
  return parsedValue;
}


function parseValue(input) {
  let cleanInput = input.trim().replace(/\s+/g, '');
  
  if (cleanInput.includes('.') || cleanInput.includes(',')) {
      cleanInput = cleanInput.replace(',', '.');

      // Séparer la partie entière et la partie décimale
      const parts = cleanInput.split('.');
      const integerPart = parts[0];
      const decimalPart = parts[1];

      // Si la partie décimale a trois chiffres, multiplier par 1000
      if (decimalPart && decimalPart.length === 3) {
          return parseInt(integerPart + decimalPart, 10);
      } else {
          return parseFloat(cleanInput);
      }
  } else {
      // Si pas de '.' ou ',', simplement convertir en nombre
      return parseInt(cleanInput, 10);
  }
}

// Fonction pour calcul electricite
export async function functionCalculElectricite(tourneId, communeId, tarif, nouvelValeur, ancienValeur, puissance, type) {
  try {
    
    const activite = "e"
    let province = ""

    const isValid = /^\d{11}$/.test(tourneId);
    if (!isValid) {
        return res.status(400).json({ error: 'Reference client invalide!' });
    }

    const tourneSlice = tourneId.slice(0, 7)

    const nouvel = parseValue(nouvelValeur);
    const ancien = parseValue(ancienValeur)


    if (!tourneId) return { messageError: "Veuillez ajouter le référence client!" };
    if (!communeId) return { messageError: "Veuillez séléctionner votre commune!" };
    if (!tarif) return { messageError: "Veuillez séléctionner tarif!" };
    if (!puissance) return { messageError: "Veuillez séléctionner le puissance de votre compteur!" };
    if (!nouvel) return { messageError: "Veuillez ajouter le nouvel index!" };
    if (ancien === null || ancien === undefined || isNaN(ancien)) return { messageError: "Veuillez ajouter l'ancien index!" };
     


    if(nouvel <= ancien) return { messageError: "Le nouvel index doit être supérieur à l'ancien!" };


        const agence = await prisma.agence.findFirst({
            where:{
              AND:[
                {tourneId : tourneSlice},
                {communeId : parseInt(communeId)}
              ]
            },
        })
        
        if (!agence) return { messageError: "Réference client introuvable" };
        province = agence.province

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
        let kwhConsomme = nouvel - ancien
        let kwhConsommeTotal = kwhConsomme
        // console.log("kwhConsomme : ",kwhConsomme);
        
        

        let quantiteParTranche = {
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
        // console.log("prixKwhTotal : ",prixKwhTotal);
        
        let primeTotal = prime * puissance
        let prixTranche = prixKwhTotal
        
      
        /**
         * SOUS TOTAL JIRAMA
         */
        let sousTotalJirama = prixKwhTotal + redevance + primeTotal
        // console.log("sousTotalJirama : ",sousTotalJirama);
        
        
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
        // console.log("taxe_communale : ",taxe_communale);
        

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
        // console.log("surtaxe : ",surtaxe);
        

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
        // console.log("fne_taxe : ",fne_taxe);

        
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
        // console.log("tva_ : ",tva_);
          
        

        /**
         * PRIX NET
         */
        let prix_net = sousTotalJirama + taxe_communale + surtaxe + fne_taxe + tva_ 

        const facture = {
          prix_net : prix_net.toFixed(2),
          reference_client : agence.tourneId,
          categorie : type,
          agence : agence.agence,
          commune : agence.commune,
          province : province,
          tarif : tarif,
          puissance : puissance,
          type: type,
          nouvel : nouvel,
          ancien : ancien,
          consommation : kwhConsommeTotal,
          prixParTranche : prixParTranche,
          consommationParTranche : consommationParTranche,
          prixTotalParTranche : prixTotalParTranche,
          prixTranche: parseInt(prixTranche.toFixed(2)),
          prime : primeTotal,
          redevance : redevance,
          taxe_communale : taxe_communale,
          surtaxe : surtaxe,
          fne : fne_taxe,
          tva : tva_
        }      
       
 
     return {facture : facture}

  } catch (error) {
    console.error("Erreur de calcul : ",error)
    return { messageError: error.message };
  }
  
}


// Fonction pour calcul eau
async function functionCalculEau(tourneId, communeId, tarifEau, nouvelValeur, ancienValeur, calibrage, type) {
  try {
    const activite = "w"
    let province = ""

    const isValid = /^\d{11}$/.test(tourneId);
    if (!isValid) {
        return res.status(400).json({ error: 'Reference client invalide!' });
    }

    const tourneSlice = tourneId.slice(0, 7)

       
    const nouvel = parseValue(nouvelValeur);
    const ancien = parseValue(ancienValeur)

    if (!tourneId) return { messageError: "Veuillez ajouter le référence client!" };
    if (!communeId) return { messageError: "Veuillez séléctionner votre commune!" };
    if (!tarifEau) return { messageError: "Veuillez séléctionner tarif en eau!" };
    if (!calibrage) return { messageError: "Veuillez séléctionner le calibrage de votre compteur!" };
    if (!nouvel) return { messageError: "Veuillez ajouter le nouvel index!" };
    if (!ancien) return { messageError: "Veuillez l'ancien index!" };

    

    if(nouvel <= ancien) return {messageError:  "Le nouvel index doit être supérieur à l'ancien!"};


    const agence = await prisma.agence.findFirst({
        where:{
          AND:[
            {tourneId : tourneSlice},
            {communeId : parseInt(communeId)}
          ]
        },
    })

    if (!agence) return { messageError: "Réference client introuvable" };
    province = agence.province

    const prix = await prisma.prix.findFirst({
        where: {
          AND: [
            { zoneId: "W" },
            { tarif: tarifEau }
          ]
        }
    });
    // console.log("prix : ",prix);
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


    const calibrageTable = await prisma.calibrage.findFirst({
      where:{
        calibrage : parseInt(calibrage)
      }
    })
    if (!calibrageTable) return { messageError: "Calibrage introuvable" };


    // console.log("calibrageTable : ",calibrageTable);
    
    let valid = false
    
    let i = 1
    let kwhConsomme = nouvel - ancien
    let kwhConsommeEau = kwhConsomme

    let quantiteParTranche = {
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
    let redevance = calibrageTable.redevance
    let prixKwhTotal = prixTotalParTranche[1] + prixTotalParTranche[2] + prixTotalParTranche[3] + prixTotalParTranche[4] 
    let primeTotal = prime * calibrage
    let prixTranche = prixKwhTotal

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
     * REDEVANCE ASSAINISSEMENT EAUX USEES
     **/ 
    let redevance_eau_usee_prix = taxe.redevanceeauusee / 100
    let redevance_eau_usee = {
      1 : prixTotalParTranche[1] * redevance_eau_usee_prix,
      2 : prixTotalParTranche[2] * redevance_eau_usee_prix,
      3 : prixTotalParTranche[3] * redevance_eau_usee_prix,
      4 : prixTotalParTranche[4] * redevance_eau_usee_prix
    }
    let redevance_eau_usee_taxe = redevance_eau_usee[1] + redevance_eau_usee[2] + redevance_eau_usee[3] + redevance_eau_usee[4]

   
    /**
     * TAXE
     */
    let tva_ = 0
    let tva_value = 0.2
   
    
    let tvaParTranche = {
      1 : 0,
      2 : 0,
      3 : 0,
      4 : 0,
      5 : 0,
      6 : 0,
      7 : 0,
      8 : 0,
      9 : 0,
    }
    // si tva est frappé partiellement
    if(type === "partiel"){
        tvaParTranche = {
          1 : ((consommationParTranche[1] - 10) * prixParTranche[1]) * tva_value,
          2 : prixTotalParTranche[2] * tva_value,
          3 : prixTotalParTranche[3] * tva_value,
          4 : prixTotalParTranche[4] * tva_value,
          5 : taxe_communale * tva_value,
          6 : surtaxe * tva_value,
          7 : redevance_eau_usee_taxe * tva_value,
          8 : redevance * tva_value,
          9 : primeTotal * tva_value,
        }
        tva_ = tvaParTranche[1] + tvaParTranche[2] + tvaParTranche[3] + tvaParTranche[4] + tvaParTranche[5] + tvaParTranche[6] + tvaParTranche[7] + tvaParTranche[8] + tvaParTranche[9]
      
  
    // si tva est frappé totalement, tout est taxé 
    }else if(type === "total"){
      tvaParTranche = {
        1 : prixTotalParTranche[1] * tva_value,
        2 : prixTotalParTranche[2] * tva_value,
        3 : prixTotalParTranche[3] * tva_value,
        4 : prixTotalParTranche[4] * tva_value,
        5 : taxe_communale * tva_value,
        6 : surtaxe * tva_value,
        7 : redevance_eau_usee_taxe * tva_value,
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
    let prix_net = sousTotalJirama + taxe_communale + surtaxe + redevance_eau_usee_taxe + tva_ 

    const facture = {
      prix_net : prix_net.toFixed(2),
      reference_client : agence.tourneId,
      categorie : type,
      agence : agence.agence,
      commune : agence.commune,
      province : province,
      tarifEau : tarifEau,
      calibrage : calibrage,
      type: type,
      nouvel : nouvel,
      ancien : ancien,
      consommation : kwhConsommeEau,
      prixParTranche : prixParTranche,
      consommationParTranche : consommationParTranche,
      prixTotalParTranche : prixTotalParTranche,
      prixTranche: parseInt(prixTranche.toFixed(2)),
      prime : primeTotal,
      redevance : redevance,
      taxe_communale : taxe_communale,
      surtaxe : surtaxe,
      redevance_eau_usee_taxe : redevance_eau_usee_taxe,
      tva : tva_
    }      
 
    return {facture : facture}

  } catch (error) {
    return { messageError: 'Erreur serveur' };
  }
  
}



export const getAllCalcul = async(req, res) =>{
  try {
      const response = await prisma.calculElectriciteEau.findMany({
        orderBy: {
            id:'desc',
        },
        include: {
          CompteElectriciteEau: true
        },
      })
      res.json(response)
     
    } catch (error) {
      res.status(500).json({ messageError: 'Erreur serveur' });
    }
}


export const getCalculByCompteElectriciteEau = async(req, res) =>{
  try {
      const idCompte = req.body.idCompte;

      const response = await prisma.calculElectriciteEau.findMany({
          where:{
            compteElectriciteEauId : parseInt(idCompte)
          },
          include: {
            CompteElectriciteEau: true
          },
      })

      res.json(response)
     
    } catch (error) {
      res.status(500).json({ messageError: 'Erreur serveur' });
    }
}



export const deleteAllCalcul= async (req, res) => {
  try {
    await prisma.calculElectriciteEau.deleteMany({});

    await prisma.$executeRaw`ALTER SEQUENCE "CalculElectriciteEau_id_seq" RESTART WITH 1;`;

    res.json({ messageSucces: "Toutes les données ont été supprimées et l'ID a été réinitialisé" });
  } catch (error) {
    res.status(500).json({ messageError: 'Erreur serveur' });
  }
};