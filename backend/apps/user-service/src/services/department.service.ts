import { eq } from 'drizzle-orm';
import { companyStructure } from '@cube-demper/database';

/**
 * Simple department/team CRUD for Cube Demper
 * No complex recursive hierarchy — just flat departments and teams.
 */
export class DepartmentService {
  constructor(private db: any) {}

  async getDepartments() {
    return this.db
      .select()
      .from(companyStructure)
      .where(eq(companyStructure.isActive, true))
      .orderBy(companyStructure.orderIndex);
  }

  async getDepartmentById(id: string) {
    const [dept] = await this.db
      .select()
      .from(companyStructure)
      .where(eq(companyStructure.id, id));
    return dept || null;
  }

  async createDepartment(data: {
    name: string;
    parentId?: string;
    type: string;
    level: string;
    description?: string;
    headUserId?: string;
  }) {
    const [dept] = await this.db
      .insert(companyStructure)
      .values(data)
      .returning();
    return dept;
  }

  async updateDepartment(id: string, data: Partial<{
    name: string;
    description: string;
    headUserId: string;
    isActive: boolean;
  }>) {
    const [dept] = await this.db
      .update(companyStructure)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(companyStructure.id, id))
      .returning();
    return dept;
  }

  async deleteDepartment(id: string) {
    return this.updateDepartment(id, { isActive: false });
  }
}
