import { string } from "better-auth/*";
import { desc, relations, sql } from "drizzle-orm";
import { integer, pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core"
import { create } from "node:domain";

const timestamp1 = {
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$defaultFn(() => new Date()).$onUpdate(() => new Date())
}

export const departments = pgTable('departments', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: varchar('description', { length: 255 }),
  ...timestamp1
});

export const subjects = pgTable('subjects', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  departmentId: integer('department_id').notNull().references(() => departments.id, {onDelete: 'restrict'}),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  description: varchar('description', { length: 255 }),
  ...timestamp1
});

export const departmentRelations = relations(departments, ({many}) => ({ subjects: many(subjects) }));

export const subjectRelations = relations(subjects, ({one, many}) => ({ department: one(departments, { fields: [subjects.departmentId], references: [departments.id] }) }));


export type Department = typeof departments.$inferSelect;
export type NewDepartment = typeof departments.$inferInsert;
export type Subject = typeof subjects.$inferSelect;
export type NewSubject = typeof subjects.$inferInsert;