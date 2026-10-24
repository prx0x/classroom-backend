import express from "express";
import { db } from "../db";
import { departments } from "../db/schema/app";
import { asc } from "drizzle-orm";

const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    const data = await db
      .select({
        id: departments.id,
        code: departments.code,
        name: departments.name,
      })
      .from(departments)
      .orderBy(asc(departments.name));

    res.json({ departments: data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch departments" });
  }
});

export default router;