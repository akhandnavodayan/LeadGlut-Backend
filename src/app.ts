import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import express, { type Application, type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import dotenv from 'dotenv';
import walletRouter from './routes/wallet.routes.js';
import leadRouter from './routes/lead.routes.js';
import whatsappService from './services/whatsapp.service';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';

dotenv.config();

Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [nodeProfilingIntegration()],
    tracesSampleRate: 1.0,
    profileSessionSampleRate: 1.0,
});

const app: Application = express();

// 1. Military-grade Security Headers (हैकर्स से बचावे खातिर)
app.use(helmet());

// 2. Strict CORS policy (खाली तोहार वेबसाइट ही API कॉल कर सके)
app.use(cors({
    origin: process.env.CLIENT_URL || '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

// 3. DDoS Protection & Rate Limiting (कवनो बोट स्पैम ना कर पावे)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 मिनट
    max: 100, // 15 मिनट में एक IP से सिर्फ 100 रिक्वेस्ट
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);

// 4. Body Parser & Logging
app.use(express.json());
app.use(morgan('dev')); // टर्मिनल में API का लॉग देखे खातिर
app.use('/api/wallet', walletRouter);
app.use('/api/lead', leadRouter);
app.use('/api/leads', leadRouter);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Test Route (चेक करे खातिर कि सर्वर चलत बा कि ना)
app.get('/', (req: Request, res: Response) => {
    res.status(200).json({ message: 'LeadGlut AI Server is running securely! 🚀' });
});

Sentry.setupExpressErrorHandler(app);

// Central Error Handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error!' });
});

const PORT = process.env.PORT || 3000;
// ई लाइन लिखला से WhatsApp सर्विस नींद से जाग जाई और QR कोड दे दी!
console.log("Initializing WhatsApp Bot...");
whatsappService;
app.listen(PORT, () => {
    console.log(`🛡️  LeadGlut Server is running on port ${PORT}`);
    void whatsappService;
});

export default app;
