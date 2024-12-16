import { Request, Response, NextFunction } from 'express';

interface AuthTokenConfig {
  secretToken: string;
  headerName: string;
  restrictedPaths: string[];
}

export const createAuthTokenMiddleware = (config: AuthTokenConfig) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if the path should be protected
    const shouldProtect = config.restrictedPaths.some(path => 
      req.path.toLowerCase().startsWith(path.toLowerCase())
    );

    if (shouldProtect) {
      const providedToken = req.header(config.headerName);

      if (!providedToken) {
        console.log(`Access denied: No token provided for ${req.path}`);
        return res.status(401).json({
          message: 'Authentication token is required'
        });
      }

      if (providedToken !== config.secretToken) {
        console.log(`Access denied: Invalid token provided for ${req.path}`);
        return res.status(403).json({
          message: 'Invalid authentication token'
        });
      }
    }

    next();
  };
};