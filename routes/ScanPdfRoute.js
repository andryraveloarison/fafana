import express from 'express';
import { displayPdfData, lecture, scanImage, scanPdf } from '../controllers/ScanPdfController.js';


const router = express.Router()

router.post('/upload', scanPdf)

router.post('/upload/facture', displayPdfData)

router.post('/upload/test', lecture)

router.post('/upload/image', scanImage)

export default router;