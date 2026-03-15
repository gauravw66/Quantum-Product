const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Quantum Cloud Runner API',
            version: '1.0.0',
            description: 'API documentation for the Quantum Cloud Runner platform',
        },
        servers: [
            {
                url: `http://localhost:${PORT}`,
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    },
    apis: ['./routes/*.js'], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/authRoutes');
app.use('/auth', authRoutes);

const quantumRoutes = require('./routes/quantumRoutes');
app.use('/quantum', quantumRoutes);

const aiRoutes = require('./routes/aiRoutes');
app.use('/ai', aiRoutes);

const jobRoutes = require('./routes/jobRoutes');
app.use('/jobs', jobRoutes);

const moduleRoutes = require('./routes/moduleRoutes');
app.use('/modules', moduleRoutes);

app.get('/', (req, res) => {
    res.send('Quantum Cloud Runner Backend is running');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
