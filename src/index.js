import dotenv from "dotenv";
import connectToDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path: "./env",
});

connectToDB()
    .then(() => {
        app.on("error", (error) => {
            console.error(`Error starting app: ${error}`);
            process.exit(1);
        });

        app.listen(process.env.PORT || 8000, () => {
            console.log(
                `Server is running on port ${process.env.PORT || 8000}`
            );
        });
    })
    .catch((error) => {
        console.log(`MongoDB connection failed: ${error}`);
    });
