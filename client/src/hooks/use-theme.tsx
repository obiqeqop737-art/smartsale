import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("documind-theme") as Theme) || "dark";
    }
    return "dark";
  });
  const isFirstRender = useRef(true);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("documind-theme", theme);
    isFirstRender.current = false;
  }, [theme]);

  const toggleTheme = useCallback(() => {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";

    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 99999;
      pointer-events: none;
      background: ${nextTheme === "dark" ? "#0f172a" : "#f1f5f9"};
      clip-path: inset(0 100% 0 0);
      transition: clip-path 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    `;
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.style.clipPath = "inset(0 0 0 0)";
    });

    setTimeout(() => {
      setTheme(nextTheme);

      requestAnimationFrame(() => {
        overlay.style.transition = "opacity 0.35s ease";
        overlay.style.opacity = "0";
      });

      setTimeout(() => {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, 400);
    }, 500);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
