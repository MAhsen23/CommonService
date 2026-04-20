import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import uploadRoutes from './routes/uploadRoutes.js';
import contactRoutes from './routes/contactRoutes.js';

const app = express();

app.use(helmet());

const allowedOrigins = (
    process.env.CORS_ORIGINS ||
    'https://www.powerpeptides.ca,https://powerpeptides.ca'
)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const corsOptions = {
    origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        if (allowedOrigins.includes(origin)) return cb(null, true);
        return cb(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: false,
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        status: 'OK',
        message: 'Server is running successfully',
        data: {
            uptime: process.uptime(),
            timestamp: Date.now(),
            version: '1.0.0'
        }
    });
});

app.use('/api/upload', uploadRoutes);
app.use('/api/contact', contactRoutes);

app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        status: 'ERROR',
        message: 'API endpoint not found',
        data: null
    });
});

app.use((err, req, res, next) => {
    res.status(500).json({
        success: false,
        status: 'ERROR',
        message: 'Something went wrong!',
        data: null
    });
});

export default app;
