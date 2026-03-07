import mangoose from "mongoose";
import { DB_NAME } from "../constant.js";


const connectedDB = async () => {
    try{
        const connenctionInstans = await mangoose.connect(`${process.env.DATA_BASE_URL}/${DB_NAME}`);


        console.log("Mangodb Database Connected Successfully !! MongoDB URL:",connenctionInstans.connection.host)
        // console.log(connenctionInstans.connection.name)

    }
    catch(error){
        console.log("MongoDB Conncection Failed !!",error);
        process.exit(1);
    }
}

export { connectedDB }