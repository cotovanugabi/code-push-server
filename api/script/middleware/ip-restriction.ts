import { Request, Response, NextFunction } from 'express';

interface IpRestrictionConfig {
  allowedIps: string[];
  restrictedPaths: string[];
}

export const createIpRestrictionMiddleware = (config: IpRestrictionConfig) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Log configuration
    console.log('IP Restriction Config:', {
      allowedIps: config.allowedIps,
      restrictedPaths: config.restrictedPaths
    });

    // Check if the current path should be restricted
    const shouldRestrict = config.restrictedPaths.some(path => 
      req.path.toLowerCase().startsWith(path.toLowerCase())
    );

    console.log('Request path:', req.path);
    console.log('Should restrict:', shouldRestrict);

    if (shouldRestrict) {
      // Get real IP from X-Forwarded-For header
      const forwardedFor = req.headers['x-forwarded-for'];
      const clientIp = Array.isArray(forwardedFor)
        ? forwardedFor[0]
        : typeof forwardedFor === 'string'
        ? forwardedFor.split(',')[0]
        : req.ip || req.connection.remoteAddress;

      // Remove IPv6 prefix if present
      const normalizedClientIp = clientIp?.replace(/^::ffff:/, '').trim();
      
      console.log('X-Forwarded-For header:', req.headers['x-forwarded-for']);
      console.log('Client IP:', clientIp);
      console.log('Normalized Client IP:', normalizedClientIp);

      // Check if client IP is in allowed list
      const isAllowed = config.allowedIps.some(ip => {
        // Handle CIDR notation
        if (ip.includes('/')) {
          const allowed = isIpInCidr(normalizedClientIp, ip);
          console.log(`Checking CIDR ${ip} against ${normalizedClientIp}:`, allowed);
          return allowed;
        }
        const allowed = ip === normalizedClientIp;
        console.log(`Checking IP ${ip} against ${normalizedClientIp}:`, allowed);
        return allowed;
      });

      console.log('Is IP allowed:', isAllowed);

      if (!isAllowed) {
        console.log(`Access denied for IP ${normalizedClientIp} to ${req.path}`);
        return res.status(403).json({
          message: 'Access denied. Your IP is not whitelisted.'
        });
      }
    }

    next();
  };
};

// Helper function to check if an IP is in a CIDR range
function isIpInCidr(ip: string, cidr: string): boolean {
  const [range, bits = "32"] = cidr.split("/");
  const mask = ~((1 << (32 - parseInt(bits))) - 1);
  
  const ipParts = ip.split(".").map(part => parseInt(part));
  const rangeParts = range.split(".").map(part => parseInt(part));
  
  const ipNum = ipParts.reduce((sum, part, i) => sum + (part << (24 - (i * 8))), 0);
  const rangeNum = rangeParts.reduce((sum, part, i) => sum + (part << (24 - (i * 8))), 0);
  
  return (ipNum & mask) === (rangeNum & mask);
}