import 'dotenv/config';
const NODE_ENV = process.env.NODE_ENV ?? 'development';
const PORT = Number(process.env.PORT ?? 5001);
const APP_CORS_ORIGINS = (process.env.APP_CORS_ORIGINS ?? '').split(',').filter(Boolean);
export const env = {
    NODE_ENV,
    PORT,
    APP_CORS_ORIGINS,
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret',
    DATABASE_URL: process.env.DATABASE_URL ?? '',
    REDIS_URL: process.env.REDIS_URL ?? '',
    EMAIL_FROM: process.env.EMAIL_FROM ?? 'no-reply@fanmeet.com',
};
