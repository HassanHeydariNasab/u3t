export const envConfig = {
  JWT_SECRET:
    process.env.JWT_SECRET ||
    'your-super-secret-jwt-key-change-this-in-production',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  PORT: parseInt(process.env.PORT || '3000', 10),
};
