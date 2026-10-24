import express from "express";
import { db } from "../db";
import { departments, subjects } from "../db/schema/app";
import { and, desc, eq, getTableColumns, ilike, sql } from "drizzle-orm";
import { redisClient } from "../db/redis";

const router = express.Router();

// GET /subjects
router.get("/", async (req, res) => {
  try {
    const {
        search, 
        department, 
        page = 1, 
        limit = 10
    } = req.query;
    const currentPage = Math.max(
        1, 
        parseInt(String(page), 10) || 1
    );
    const limitPerPage = Math.min(
        100, 
        Math.max(1, parseInt(String(limit), 10) || 10)
    );

    // build cache key from all query params
    const cacheKey = `subjects:${JSON.stringify({
        search: search || '',
        department: department || '',
        page: currentPage,
        limit: limitPerPage
    })}`;

    // check redis cache
    const cachedResult = await redisClient.get(cacheKey);
    if (cachedResult){
        res.status(200).json({
            ...JSON.parse(cachedResult),
            fromCache: true,
        });
        return;
    }

    const offset = (currentPage - 1) * limitPerPage;
    const filterConditions= [];

    // search by name or code
    if (search) {
      filterConditions.push(
        ilike(subjects.name, `%${search}%`),
        ilike(subjects.code, `%${search}%`),
      );
    }
    // filterepartment name
    if (department) {
        const deptPattern = `%${String(department).replace(/[%_]/g, '\\$&')}%`; //prevent SQL injection
        filterConditions.push(ilike(departments.name, deptPattern));
    }

    // combine result using 'and'
    const whereClause = filterConditions.length > 0 ?  and(...filterConditions ) : undefined;
    // count the matching result
    const countResult = await db.select({count: sql`count(*)`}).from(subjects).leftJoin(departments, eq(subjects.departmentId, departments.id)).where(whereClause);

    const totalCount = countResult[0]?.count ?? 0;
    // fetch the requested page of subjects with department info
    const subjectsList = await db.select({
        ...getTableColumns(subjects),
        department: {...getTableColumns(departments)}
    }).from(subjects).leftJoin(departments, eq(subjects.departmentId, departments.id))
    .where(whereClause)
    .orderBy(desc(subjects.createdAt))
    .limit(limitPerPage)
    .offset(offset);

    const responseData ={
        subjects: subjectsList,
        pagination: {
            page: currentPage,
            limit: limitPerPage,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limitPerPage)
        }
    };

    // cache the response for 5 minutes
    await redisClient.set(
        cacheKey,
        JSON.stringify(responseData),
        {
            EX:300 //expires in 5 minutes
        }
    );
    // send the db result to client if database miss
    res.status(200).json({
        ...responseData, 
        fromCache: false,
    });


  } catch (error) {
    console.error("GET /subjects error: ", error);
    res.status(500).json({ error: "Failed to fetch subjects" });
  }
})

export default router;