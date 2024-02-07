import connectionDb from "./db/index.js";
import dotenv from "dotenv"

dotenv.config()

connectionDb()

/*

import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import express from "express";
import 'dotenv/config'


const app = express()
;(async()=>{
    try {

       await mongoose.connect(`${process.env.MONGODB_URI}/ ${DB_NAME}`)

       app.on('error', (error)=>{
          console.log("Server Error is : ", error);
          //throw error

       })

       app.listen(process.env.PORT, ()=>{
        console.log(`The app listen on Port:  ${process.env.PORT}`);
       })
        
    } catch (error) {
        console.log("ERROE: ", error);
        throw error 
    }
})();

*/