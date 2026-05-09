import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service.js";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * This is a test
   * @remarks A greeting string
   */
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
