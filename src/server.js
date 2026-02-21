import app from './app.js';
import config from './config/config.js';
import { print } from './helpers/helpers.js';

const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;

if (!isVercel) {
    const PORT = config.port;
    try {
        app.listen(PORT, () => {
            print(`CommonService server running in ${config.env} mode on port ${PORT}`);
        });
    } catch (err) {
        print('Failed to start server', err.message);
        process.exit(1);
    }
}

export default app;
