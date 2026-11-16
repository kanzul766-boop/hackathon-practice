import express from "express";
import jwt from 'jsonwebtoken'
import userModel from "../models/users.model.js";

const router = express.Router();

router.post("/create",async(req, res) => {
 const token = req.cookies.token;

 if(!token){
    return res.status(401).json({message : "inauth"});

 }
 try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await userModel.findOne({_id : decoded.id})
    if (!user) {
      return res.status(401).json({ message: "User not found" })
    }
    return res.status(501).json({ message: "Post creation is not implemented" })
 }catch(err){
    return res.status(401).json({message : "invalid token"})
 }
}
);

export default router; 