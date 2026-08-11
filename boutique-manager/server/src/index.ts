import { app } from './app.js';
import { env } from './config/env.js';

if (env.NODE_ENV !== 'production') {
  app.listen(env.PORT, () => {
    console.log(`API disponible sur http://localhost:${env.PORT}`);
  });
}

export default app;
