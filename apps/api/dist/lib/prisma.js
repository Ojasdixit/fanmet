import { PrismaClient } from '@prisma/client';
class PrismaService extends PrismaClient {
    constructor() {
        super();
    }
}
export const prisma = new PrismaService();
