import app from "./src/app.ts";
import { config } from "./src/config/config.ts";
import connectDB from "./src/config/db.ts";

const startServer = async () => {
    await connectDB();

    const port = process.env.PORT || config.port;

    app.listen(port, () => {
        console.log(`Listening on port: ${port}`);
    });
};

startServer();