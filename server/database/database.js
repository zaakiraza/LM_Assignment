import mongoose from "mongoose";

export async function connectDatabase() {
    const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/line-manager";
    mongoose.set("strictQuery", true);
    await mongoose.connect(uri);
    console.log(`MongoDB connected: ${uri}`);
    return mongoose.connection;
}

export default mongoose;
