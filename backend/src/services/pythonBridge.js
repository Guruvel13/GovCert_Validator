const { spawn } = require("child_process");
const path = require("path");

const PYTHON_PATH = process.env.PYTHON_PATH || "python3";

// Resolve VERIFIER_PATH relative to project root (two levels up from backend/src/services/)
const PROJECT_ROOT = path.resolve(__dirname, "../../../");
const verifierEnvPath = process.env.VERIFIER_PATH || "../verifier/verify.py";
const VERIFIER_PATH = path.isAbsolute(verifierEnvPath)
  ? verifierEnvPath
  : path.resolve(PROJECT_ROOT, "verifier/verify.py");

/**
 * spawnVerifier — Runs the Python verifier on a given file.
 * @param {string} filePath - Absolute path to the uploaded certificate file
 * @returns {Promise<object>} Parsed JSON result from the Python script
 */
const spawnVerifier = (filePath) => {
  return new Promise((resolve, reject) => {
    const args = [VERIFIER_PATH, filePath];
    const proc = spawn(PYTHON_PATH, args, {
      env: { ...process.env, PYTHONUNBUFFERED: "1" },
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      try {
        // Extract the JSON block from stdout (ignore non-JSON print lines)
        const jsonMatch = stdout.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          return reject(
            new Error(`Python verifier returned no JSON. stderr: ${stderr}`)
          );
        }
        const result = JSON.parse(jsonMatch[0]);
        resolve(result);
      } catch (err) {
        reject(
          new Error(
            `Failed to parse Python output: ${err.message}. stdout: ${stdout}`
          )
        );
      }
    });

    proc.on("error", (err) => {
      reject(new Error(`Failed to spawn Python process: ${err.message}`));
    });
  });
};

module.exports = { spawnVerifier };
