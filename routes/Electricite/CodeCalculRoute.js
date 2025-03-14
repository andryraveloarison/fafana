import express from 'express'
import { calculEau, calculElectricite, calculElectriciteEau, calculElectriciteUser, calculElectriciteUserChoix, deleteAllCalcul, getAllCalcul, getCalculByCompteElectriciteEau } from '../../controllers/Electricite/CodeCalculElectricite.js';

const router = express.Router()

router.post("/calculelectriciteeau", calculElectriciteEau)
router.post("/calculelectricite", calculElectricite)
router.post("/calculeau", calculEau)
router.get("/getallcalcul", getAllCalcul)
router.delete("/deleteallcalcul", deleteAllCalcul)
router.post("/getcalculbycompteelectricite", getCalculByCompteElectriciteEau)
router.post("/calculElectriciteuser", calculElectriciteUser)
router.post("/calculElectriciteuserchoix", calculElectriciteUserChoix)

export default router;