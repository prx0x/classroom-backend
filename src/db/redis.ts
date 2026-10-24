import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL is not defined in the environment variables");
}

export const redisClient = createClient({
    url: redisUrl,
});

redisClient.on("error", (error) => {
  console.error("Redis error:", error);
});