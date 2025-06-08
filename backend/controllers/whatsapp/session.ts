import fs from "fs";

const SESSION_FILE_PATH = "./session.json";

export const loadSession = () => {
  if (fs.existsSync(SESSION_FILE_PATH)) {
    const sessionData = fs.readFileSync(SESSION_FILE_PATH, "utf-8");
    return JSON.parse(sessionData);
  }
  return null;
};

export const saveSession = (session: object) => {
  fs.writeFileSync(SESSION_FILE_PATH, JSON.stringify(session));
};
