import { Request, Response, NextFunction } from "express";

function clean(obj: any): any {
  if (obj && typeof obj === "object") {
    for (const key in obj) {
      if (key.startsWith("$")) {
        delete obj[key];
      } else {
        clean(obj[key]);
      }
    }
  }
  return obj;
}

export function sanitizeNoSql(req: Request, _res: Response, next: NextFunction) {
  if (req.body) clean(req.body);
  if (req.query) clean(req.query);
  if (req.params) clean(req.params);
  next();
}
