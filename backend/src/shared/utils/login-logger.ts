import { mkdirSync, appendFileSync } from "fs";
import { join } from "path";

const logDirectory = join(process.cwd(), "logs");
const loginLogPath = join(logDirectory, "login.log");

type LoginLogEntry =
  | { outcome: "success"; email: string; userId: string }
  | { outcome: "failure"; email: string; reason: string };

export function logLoginAttempt(entry: LoginLogEntry) {
  mkdirSync(logDirectory, { recursive: true });

  const record = {
    timestamp: new Date().toISOString(),
    ...entry,
  };

  appendFileSync(loginLogPath, `${JSON.stringify(record)}\n`, "utf8");
}

export { loginLogPath };
