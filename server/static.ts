// server/static.ts - Express 静态文件服务
import express from "express";
import path from "path";
import fs from "fs";

export function serveStatic(app: express.Express) {
  const staticPath = path.join(process.cwd(), "dist", "public");

  // 检查静态文件目录是否存在
  if (!fs.existsSync(staticPath)) {
    console.warn("Static directory not found:", staticPath);
    return;
  }

  // 服务静态文件
  app.use(express.static(staticPath));

  // SPA 路由 fallback - 所有未匹配的路由返回 index.html
  app.get("*", (_req, res) => {
    const indexPath = path.join(staticPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Not Found");
    }
  });

  console.log("Static files served from:", staticPath);
}
