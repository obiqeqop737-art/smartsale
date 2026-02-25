import { Express } from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as ReplitStrategy } from "passport-replit";
import { storage } from "../storage";

export async function setupAuth(app: Express) {
  app.use(session({
    secret: process.env.SESSION_SECRET || "documind-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: app.get("env") === "production" }
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new ReplitStrategy({}, async (profile: any, done: any) => {
    try {
      let user = await storage.getUserById(profile.id);
      if (!user) {
        user = await storage.updateUser(profile.id, {
          id: profile.id,
          email: profile.email,
          firstName: profile.name?.split(" ")[0] || "User",
          lastName: profile.name?.split(" ").slice(1).join(" ") || "",
          profileImageUrl: profile.picture,
          role: (profile.email === "admin" || profile.name?.toLowerCase() === "admin") ? "admin" : "user"
        } as any);
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUserById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
}

export function registerAuthRoutes(app: Express) {
  app.get("/api/login", passport.authenticate("replit"));
  app.get("/api/auth/replit/callback", 
    passport.authenticate("replit", { failureRedirect: "/login" }),
    (req, res) => res.redirect("/")
  );
  app.get("/api/logout", (req, res) => {
    req.logout(() => res.redirect("/"));
  });
}

export function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: "Unauthorized" });
}
