import express from "express";
import cors from "cors";
// import { subjects } from "./db/schema";
// @ts-ignore
import subjectsRouter from "./routes/subjects";
import { redisClient } from "./db/redis";
import { start } from "repl";

async function startServer(){
    await redisClient.connect();
    app.listen(PORT, () => {
        console.log(`Server is running at the ${process.env.REDIS_URL}`);
    });
}
startServer().catch(console.error);

const app = express();
const PORT = 8000;

if (!process.env.FRONTEND_URL) {
    throw new Error('FRONTEND_URL is not defined');
}

app.use(cors({
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}))

app.use(express.json());

app.use('/api/subjects', subjectsRouter);

app.get('/', (req, res) => {
    res.send("Hello, welcome to the classroom API!");
});

app.listen(PORT, () => {
    console.log(`Server is running at the localhost:${PORT}`);
})