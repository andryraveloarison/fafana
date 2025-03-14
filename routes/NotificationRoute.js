import express from 'express'
import { deleteAllNotification, getAllNotification, getNotificationUser, getNotificationUserFiltre } from '../controllers/NotificationController.js';

const router = express.Router()

router.get("/getallnotif", getAllNotification)
router.post("/getnotificationuser", getNotificationUser)
router.post("/getnotificationuserfiltre", getNotificationUserFiltre)
router.delete("/deleteallnotification", deleteAllNotification)

export default router;