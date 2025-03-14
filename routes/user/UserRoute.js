import express from 'express'
import { decodePasswordUser, deleteAllDataBD, getAllUser, getProfileDefaultAdmin, getProfileDefaultUser, getTokenByID, getUserById, getUserByToken, login, register, ResetPassword, sendMail, sendMailForgotPassword, sendMailTest, updateNotificationUser, updateUrlUser, updateUser, updateUserImageDefault, updateUserTypeOfUser, valide, verifyInfoUser, verifyToken } from '../../controllers/User/UserController.js';
import { getAllTypeUser, getTypeUserById, createTypeUser, updateTypeUserAllUser } from '../../controllers/User/UserTypeController.js';

const router = express.Router()

router.get("/getalluser", getAllUser)
router.post("/getuserbyid", getUserById)
router.put("/register", register)
router.post("/login", login)
router.post("/sendmail", sendMail)
router.post("/sendmailtest", sendMailTest)
router.post("/updateuser", updateUser)
router.post("/getuserbytoken", getUserByToken)
router.post("/updateurluser", updateUrlUser)
router.post("/verifytoken", updateUrlUser)
router.post("/verifyuserinfo", verifyInfoUser)
router.post("/valide", valide)
router.post("/gettokenbyid", getTokenByID)
router.delete("/deletealldatabd", deleteAllDataBD)
router.get("/getprofiledefaultuser", getProfileDefaultUser)
router.get("/getprofiledefaultadmin", getProfileDefaultAdmin)
router.post("/updateuserimagedefault", updateUserImageDefault)

// password forgot
router.post("/sendmailforgotpassword", sendMailForgotPassword)
router.post("/resetpassword", ResetPassword)

router.post("/updatenotificationuser", (req, res) => updateNotificationUser(req, res))

// user type
router.post("/updateusertypeofuser", updateUserTypeOfUser)


// user type
router.post("/updateusertypeofuser", updateUserTypeOfUser)


// user type
router.post("/decodepassworduser", decodePasswordUser)






/**
 * 
 *  USER TYPE CONTROLLER
 */
router.get("/getallusertype", getAllTypeUser)
router.post("/gettypeuserbyid", getTypeUserById)
router.put("/createtypeuser", createTypeUser)
router.post("/updatetypeuseralluser", updateTypeUserAllUser)


export default router;
