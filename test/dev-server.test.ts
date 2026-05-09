import { existsSync } from "node:fs";
import { join } from "node:path";
import { test } from "./fixtures.js";
import { expect } from "vitest";

interface OpenApiOperation {
  description?: string;
}

interface OpenApiSpec {
  info: { title: string };
  paths: Record<string, { get?: OpenApiOperation }>;
}

function isOpenApiSpec(value: unknown): value is OpenApiSpec {
  return typeof value === "object" && value !== null && "info" in value && "paths" in value;
}

async function fetchSpec(baseUrl: string): Promise<OpenApiSpec> {
  const res = await fetch(`${baseUrl}/apidocs-json`);
  const raw: unknown = await res.json();
  if (!isOpenApiSpec(raw)) throw new Error("Response is not a valid OpenAPI spec");
  return raw;
}

test.describe("dev server tests", () => {
  test("GET / returns NestJS response", async ({ devServer }) => {
    const res = await fetch(`${devServer.baseUrl}/`);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("Hello from NestJS running inside Vite!");
  });

  test("GET /apidocs serves Swagger UI", async ({ devServer }) => {
    const res = await fetch(`${devServer.baseUrl}/apidocs`);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("swagger");
  });

  test("GET /apidocs-json returns OpenAPI spec with correct data", async ({ devServer }) => {
    const spec = await fetchSpec(devServer.baseUrl);
    expect(spec).toMatchInlineSnapshot(`
      {
        "components": {
          "schemas": {},
        },
        "info": {
          "contact": {},
          "description": "",
          "title": "My API",
          "version": "1.0.0",
        },
        "openapi": "3.0.0",
        "paths": {
          "/": {
            "get": {
              "description": "A greeting string",
              "operationId": "AppController_getHello",
              "parameters": [],
              "responses": {
                "200": {
                  "content": {
                    "application/json": {
                      "schema": {
                        "type": "string",
                      },
                    },
                  },
                  "description": "A greeting string",
                },
              },
              "summary": "This is a test",
              "tags": [
                "App",
              ],
            },
          },
        },
        "servers": [],
        "tags": [],
      }
    `);
  });

  test("metadata.ts is written to disk by the Swagger plugin", async ({
    projectDirectory,
    devServer: _,
  }) => {
    expect(existsSync(join(projectDirectory, "src/metadata.ts"))).toBe(true);
  });
});
