import express from 'express'
import { payer } from '../controllers/PaiementController.js';

const router = express.Router()

router.post("/payer", payer)

export default router;