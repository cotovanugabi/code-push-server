import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: {
    title: 'CodePush Server API',
    description: 'Documentation for CodePush Server API endpoints'
  },
  host: process.env.SERVER_URL || 'localhost:3000',
  schemes: ['http', 'https'],
  securityDefinitions: {
    bearerAuth: {
      type: 'apiKey',
      name: 'Authorization',
      in: 'header'
    }
  },
  definitions: {
    LoginRequest: {
      email: 'user@example.com',
      accessKey: 'your-access-key'
    },
    UpdateCheckRequest: {
      deploymentKey: 'your-deployment-key',
      appVersion: '1.0.0',
      packageHash: 'hash-of-current-package'
    }
  }
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['./server.ts', './api/**/*.ts'];

swaggerAutogen()(outputFile, endpointsFiles, doc);