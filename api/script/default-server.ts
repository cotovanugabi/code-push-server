// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as api from "./api";
import { AzureStorage } from "./storage/azure-storage";
import { fileUploadMiddleware } from "./file-upload-manager";
import { JsonStorage } from "./storage/json-storage";
import { RedisManager } from "./redis-manager";
import { Storage } from "./storage/storage";
import { Response } from "express";
import { createAuthTokenMiddleware } from "./middleware/auth-token-protection";
import * as swaggerUi from 'swagger-ui-express';

const { DefaultAzureCredential } = require("@azure/identity");
const { SecretClient } = require("@azure/keyvault-secrets");

import * as bodyParser from "body-parser";
const domain = require("express-domain-middleware");
import * as express from "express";
import * as q from "q";

interface Secret {
  id: string;
  value: string;
}

function bodyParserErrorHandler(err: any, req: express.Request, res: express.Response, next: Function): void {
  if (err) {
    if (err.message === "invalid json" || (err.name === "SyntaxError" && ~err.stack.indexOf("body-parser"))) {
      req.body = null;
      next();
    } else {
      next(err);
    }
  } else {
    next();
  }
}

export function start(done: (err?: any, server?: express.Express, storage?: Storage) => void, useJsonStorage?: boolean): void {
  let storage: Storage;
  let isKeyVaultConfigured: boolean;
  let keyvaultClient: any;

  q<void>(null)
    .then(async () => {
      if (useJsonStorage) {
        storage = new JsonStorage();
      } else if (!process.env.AZURE_KEYVAULT_ACCOUNT) {
        storage = new AzureStorage();
      } else {
        isKeyVaultConfigured = true;

        const credential = new DefaultAzureCredential();

        const vaultName = process.env.AZURE_KEYVAULT_ACCOUNT;
        const url = `https://${vaultName}.vault.azure.net`;

        const keyvaultClient = new SecretClient(url, credential);
        const secret = await keyvaultClient.getSecret(`storage-${process.env.AZURE_STORAGE_ACCOUNT}`);
        storage = new AzureStorage(process.env.AZURE_STORAGE_ACCOUNT, secret);
      }
    })
    .then(() => {
      const app = express();
      const auth = api.auth({ storage: storage });
      const appInsights = api.appInsights();
      const redisManager = new RedisManager();

      // First, to wrap all requests and catch all exceptions.
      app.use(domain);

      // Setup Swagger UI with auto-generated documentation
      const swaggerFile = require('./swagger-output.json');
      app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));

      // Auth token protection middleware for /auth paths
      const authTokenProtection = createAuthTokenMiddleware({
        secretToken: process.env.AUTH_SECRET_TOKEN || 'your-default-secret-token',
        headerName: 'X-Auth-Token',
        restrictedPaths: ['/auth/']
      });
      app.use(authTokenProtection);

      // Rest of your existing code...
