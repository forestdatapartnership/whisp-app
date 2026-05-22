import type { NextConfig } from "next";
import fs from "fs";
import path from "path";

const rootDir = path.join(import.meta.dirname, "..");

const appVersion = (() => {
  try {
    return fs.readFileSync(path.join(rootDir, ".version"), "utf-8").trim() || "0.0.0";
  } catch {
    return "0.0.0";
  }
})();

const whispPythonVersion = (() => {
  try {
    const content = fs.readFileSync(path.join(rootDir, "api", "pyproject.toml"), "utf-8");
    const line = content.split("\n").find((l) => l.trim().includes('openforis-whisp=='));
return line ? (line.split("==")[1]?.trim().replace(/[",\]]/g, '') || "unknown") : "unknown";
  } catch {
    return "unknown";
  }
})();

const nextConfig: NextConfig = {
  turbopack: {
    root: import.meta.dirname,
  },
  allowedDevOrigins: ["127.0.0.1"],
  env: {
    NEXT_PUBLIC_APP_VERSION: appVersion,
    NEXT_PUBLIC_WHISP_PYTHON_VERSION: whispPythonVersion,
  },
};

export default nextConfig;
