import { createApp } from '../src/app';
import { pool } from '../src/db/pool';

const app = createApp(pool);

// Export for Vercel serverless
export default app;
