import swaggerJSDoc from 'swagger-jsdoc';

const swaggerDefinition: swaggerJSDoc.OAS3Definition = {
  openapi: '3.0.3',
  info: {
    title: 'LeadGlut API',
    version: '1.0.0',
    description: 'Secure API for wallet-backed B2B lead hunting and delivery.',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local development server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Clerk session token. Use the token without the Bearer prefix.',
      },
    },
    schemas: {
      Lead: {
        type: 'object',
        required: ['businessName', 'phone', 'address', 'website'],
        properties: {
          businessName: { type: 'string', example: 'Sample B2B Company' },
          phone: { type: 'string', example: '+91 98765 43210' },
          address: { type: 'string', example: 'Azamgarh, Uttar Pradesh' },
          website: { type: 'string', format: 'uri', example: 'https://example.com' },
        },
      },
      Error: {
        type: 'object',
        required: ['error'],
        properties: {
          error: { type: 'string', example: 'Unauthorized' },
        },
      },
    },
  },
};

const swaggerOptions: swaggerJSDoc.Options = {
  definition: swaggerDefinition,
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);

export default swaggerSpec;
