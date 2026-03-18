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
const quantumRoutes = require('./routes/quantumRoutes');
const aiRoutes = require('./routes/aiRoutes');
const jobRoutes = require('./routes/jobRoutes');
const moduleRoutes = require('./routes/moduleRoutes');
const generateCircuitRoute = require('./routes/generateCircuit');


app.use('/api/auth', authRoutes);
app.use('/api/quantum', quantumRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/generate-circuit', generateCircuitRoute);

app.get('/', (req, res) => {
    res.send('Quantum Cloud Runner Backend is running');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
