import express from "express";
import { db } from "../db";
import { departments, subjects } from "../db/schema/app";
import { and, desc, eq, getTableColumns, ilike, sql } from "drizzle-orm";

const router = express.Router();

// GET /subjects
router.get("/", async (req, res) => {
  try {
    const {search, department, page = 1, limit = 10} = req.query;
    const currentPage = Math.max(1, parseInt(String(page), 10) || 1);
    const limitPerPage = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 10));

    const offset = (currentPage - 1) * limitPerPage;

    const filterConditions= [];

    if (search) {
      filterConditions.push(
        ilike(subjects.name, `%${search}%`),
        ilike(subjects.code, `%${search}%`),
      );
    }

    if (department) {
        const deptPattern = `%${String(department).replace(/[%_]/g, '\\$&')}%`;
        filterConditions.push(ilike(departments.name, deptPattern));
    }

    // combine result using and
    const whereClause = filterConditions.length > 0 ?  and(...filterConditions ) : undefined;

    const countResult = await db.select({count: sql`count(*)`}).from(subjects).leftJoin(departments, eq(subjects.departmentId, departments.id)).where(whereClause);

    const totalCount = countResult[0]?.count ?? 0;

    const subjectsList = await db.select({
        ...getTableColumns(subjects),
        department: {...getTableColumns(departments)}
    }).from(subjects).leftJoin(departments, eq(subjects.departmentId, departments.id))
    .where(whereClause)
    .orderBy(desc(subjects.createdAt))
    .limit(limitPerPage)
    .offset(offset);

    res.status(200).json({
        subjects: subjectsList,
        pagination: {
            page: currentPage,
            limit: limitPerPage,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limitPerPage)
        }
    });
  } catch (error) {
    console.error("GET /subjects error: ", error);
    res.status(500).json({ error: "Failed to fetch subjects" });
  }
})

export default router;