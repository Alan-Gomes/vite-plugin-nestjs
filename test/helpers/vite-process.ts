import { execa, ExecaError, type ResultPromise } from "execa";

export type DevServer = {
  baseUrl: string;
  subprocess: ResultPromise;
};

export type BuildResult = {
  exitCode: number | undefined;
  stdout: string;
  stderr: string;
};

export async function startViteDev(cwd: string): Promise<DevServer> {
  const subprocess = execa("pnpm", ["vite"], { cwd, all: true });

  subprocess.all.pipe(process.stdout);

  const baseUrl = await new Promise<string>((resolve, reject) => {
    const timer = setTimeout(() => {
      subprocess.stdout?.off("data", onData);
      reject(new Error("Dev server did not start within 30 s"));
    }, 30_000);

    const onData = (chunk: Buffer) => {
      const match = String(chunk).match(/Local:\s+(http:\/\/localhost:\d+)/);
      if (match) {
        clearTimeout(timer);
        subprocess.stdout?.off("data", onData);
        resolve(match[1]);
      }
    };

    subprocess.stdout?.on("data", onData);
    subprocess.catch((err: unknown) => {
      clearTimeout(timer);
      reject(err);
    });
  });

  return { baseUrl, subprocess };
}

export async function runViteBuild(cwd: string): Promise<BuildResult> {
  try {
    const result = await execa("pnpm", ["vite", "build"], { cwd });
    return {
      exitCode: result.exitCode,
      stdout: result.stdout ?? "",
      stderr: result.stderr ?? "",
    };
  } catch (error) {
    if (error instanceof ExecaError) {
      return {
        exitCode: error.exitCode,
        stdout: error.stdout ?? "",
        stderr: error.stderr ?? "",
      };
    }
    throw error;
  }
}

export async function killProcess(subprocess: ResultPromise): Promise<void> {
  subprocess.kill();
  await subprocess.catch(() => {});
}
