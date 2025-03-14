import express from 'express'
import { getAllBlog, createBlog, getBlogByBlogType, getBlogById, updateBlog, updateUrlBlog, deleteBlog } from '../../controllers/Blog/BlogController.js';
import { getAllBlogType, getBlogTypeById, createBlogType, updateBlogType } from '../../controllers/Blog/BlogTypeController.js';
import { createBlogPersoUser, deleteAllBlogPersoUser, deleteBlogPersoUserById, getAllBlogPersoUser } from '../../controllers/Blog/BlogPersoUserController.js';

const router = express.Router()

/**
 * BLOG
 */
router.get("/getallblog", getAllBlog)
router.post("/getblogbyid", getBlogById)
router.post("/getblogbyblogtype", getBlogByBlogType)
router.put('/createblog', (req, res) => createBlog(req, res));
router.post("/updateblog", updateBlog)
router.post("/updateurlblog", updateUrlBlog)
router.delete("/deleteblog", deleteBlog)




/**
 * BLOG TYPE
 */
router.get("/getallblogtype", getAllBlogType)
router.post("/getblogtypebyid", getBlogTypeById)
router.put("/createblogtype", createBlogType)
router.post("/updateblogtype", updateBlogType)


/**
 * BLOG PERSO USER
 */
router.post("/getallblogpersouser", getAllBlogPersoUser)
router.post("/createblogpersouser", (req, res) => createBlogPersoUser(req, res))
router.delete("/deleteblogpersouserbyid", deleteBlogPersoUserById)
router.delete("/deleteallblogpersouser", deleteAllBlogPersoUser)

export default router;