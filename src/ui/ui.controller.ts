import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { loginPage, registerPage, homePage } from './ui.templates';

@Controller('ui')
export class UiController {
  @Get('login')
  login(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/html');
    res.send(loginPage());
  }

  @Get('register')
  register(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/html');
    res.send(registerPage());
  }

  @Get('home')
  home(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/html');
    res.send(homePage());
  }
}
