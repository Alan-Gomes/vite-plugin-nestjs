import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
// @ts-ignore
import metadata from "./metadata.js";

const app = await NestFactory.create(AppModule);

await SwaggerModule.loadPluginMetadata(metadata);
const document = SwaggerModule.createDocument(
  app,
  new DocumentBuilder().setTitle("My API").build(),
);
SwaggerModule.setup("apidocs", app, document);

if (import.meta.env.PROD) {
  await app.listen(3000);
}

export default app;
