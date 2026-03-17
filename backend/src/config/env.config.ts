export default () => ({
  port: Number(process.env.PORT ?? 3001),
  host: process.env.HOST ?? '127.0.0.1',
  cors: {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  },
  xai: {
    apiKey: process.env.XAI_API_KEY ?? '',
    baseUrl: 'https://api.x.ai/v1',
    model: 'grok-2-latest',
  },
  firebase: {
    apiKey: process.env.FIREBASE_API_KEY ?? '',
    projectId: process.env.FIREBASE_PROJECT_ID ?? '',
  },
});
