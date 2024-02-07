import mongoose from "mongoose";
import express from "express";
import { DB_NAME } from "../constants.js";

const app = express()

const connectionDb =  async ()=>{
   try{
        const returnObj = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

        // console.log(returnObj);
        console.log("DB_MONGO Connected at the Host: ", returnObj.connection.host);
        // console.log("DB Connected");

        // console.log(`${process.env.MONGODB_URI}/${DB_NAME}`);

       app.on('error',(error)=>{
        console.log('Server Error Occuer: ',error);
       })

       app.listen(process.env.PORT , ()=>{
        console.log(`The App is listing on the Port: ${process.env.PORT}`);
       })
      }  
    
    catch (error) {
        console.log("Enable to Connect to the DataBase: ", error);
        process.exit(1)
    }
} 

export default connectionDb