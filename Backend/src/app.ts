import express from "express";
import bodyParser from "body-parser";

const app = express();

app.use(bodyParser.json());

app.get('/', (req, res, _next) => {
    res.json({
        message: "Welcome to University Chatbot(RAG Model)"
    });
});

export default app;
