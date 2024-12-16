import * as swaggerUi from 'swagger-ui-express';
import { swaggerDocument } from './swagger';

// ... restul codului existent ...

// Adaugă aceste linii înainte de app.get("/")
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ... restul codului existent ...