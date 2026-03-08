import { Controller, Get, Request, UseGuards } from "@nestjs/common";
import { AppService } from "./app.service";
import { JwtAuthGuard } from "./auth/guards/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "./auth/guards/optional-jwt-auth.guard";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("hello")
  getHello(): string {
    return this.appService.getHello();
  }

  @Get("health")
  getHealth(): { status: string } {
    return this.appService.getHealth();
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  getHome(@Request() req): string {
    if (req.user) {
      return "Welcome home!";
    }
    return "Please login";
  }
}
