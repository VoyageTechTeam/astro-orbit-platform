const swaggerUi = require('swagger-ui-express');

const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Astro Orbit API',
    version: '1.0.0',
    description: 'Production API documentation for Astro Orbit travel platform backend.',
  },
  servers: [
    {
      url: 'http://localhost:5000/api/v1',
      description: 'Local Development Server',
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
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'fail' },
          message: { type: 'string', example: 'Invalid token' },
        },
      },
      RegisterPayload: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'traveler@astroorbit.com' },
          password: { type: 'string', minLength: 8, example: 'SuperSecret123!' },
          full_name: { type: 'string', example: 'Jane Doe' },
          role: { type: 'string', enum: ['traveler', 'host'], example: 'traveler' },
        },
      },
      BookingPayload: {
        type: 'object',
        required: ['property_id', 'check_in_date', 'check_out_date', 'guests'],
        properties: {
          property_id: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174000' },
          check_in_date: { type: 'string', format: 'date', example: '2026-08-10' },
          check_out_date: { type: 'string', format: 'date', example: '2026-08-15' },
          guests: { type: 'integer', example: 2 },
        },
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        summary: 'Register a new user',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterPayload' },
            },
          },
        },
        responses: {
          201: { description: 'User created successfully' },
          400: { description: 'Validation error' },
        },
      },
    },
    '/bookings': {
      post: {
        summary: 'Create a pending booking and generate Stripe payment intent',
        tags: ['Bookings'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/BookingPayload' },
            },
          },
        },
        responses: {
          201: { description: 'Booking initiated and client_secret generated' },
          409: { description: 'Double booking conflict' },
        },
      },
    },
    '/healthz': {
      get: {
        summary: 'System health probe',
        tags: ['Monitoring'],
        responses: {
          200: { description: 'System healthy' },
          503: { description: 'Service degraded' },
        },
      },
    },
  },
};

const setupSwagger = (app) => {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

module.exports = { setupSwagger };
