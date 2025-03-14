import stripe from 'stripe'; 
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const keyPayement = process.env.KEY_SECRETE_STRIPE

export const payer = async (req, res) => {
    
    const stripeClient = stripe(keyPayement);

    // GET FACTURE
    const idCalculElectriciteEau = req.body.idCalculElectriciteEau
    const response = await prisma.calculElectriciteEau.findUnique({
        where: {
            id: parseInt(idCalculElectriciteEau)
        }
    })
    if (!response) return res.json({ messageError: `Ce facture n'existe pas` })

    
    if(response.status === false){
        const amount = response.total
        const currency = "usd"
        const description = "Paiement facture"

        try {

            const paymentIntent = await stripeClient.paymentIntents.create({
                amount: parseInt(amount),
                currency,
                description, 
            });

            await prisma.calculElectriciteEau.update({
                where: {
                    id: parseInt(idCalculElectriciteEau),
                },
                data: {
                  status: true
                },
              });

            res.status(200).json({
                messageSuccess : "Votre pseudo est bien modifié",
                paymentIntent
            });

        } catch (error) {
            res.status(400).json({ messageError: "Erreur serveur" });
        }
    }else{
        res.status(200).json({messageSuccess: "Cette facture est déjà payée"})
    }



   
}
