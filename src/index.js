import connectionDb from "./db/index.js";
import dotenv from "dotenv"
import { app } from "./app.js";

dotenv.config()

connectionDb()
.then(() => {

    
    app.on('error', (error)=>{
        console.log(`Enable to get response from Server: ${error} `);
    })
    
    
    app.listen(process.env.PORT || 8000)
    {
        console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
    }
    
}).catch((err) => {

    console.log(`Enable to  connect with MONGODB:  ${err}`);
    
});

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