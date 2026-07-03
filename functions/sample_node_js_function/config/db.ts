import mongoose from "mongoose";

export const connectMongo = async (): Promise<void> => {
    if (mongoose.connection.readyState === 1) return;

    const options = process.env.MONGODB_DB_NAME
        ? {
            dbName: process.env.MONGODB_DB_NAME,
        }
        : {};
    if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI is not defined in the environment variables.");
    }
    await mongoose.connect(process.env.MONGODB_URI, options);
    console.log("Connected to MongoDB");
};