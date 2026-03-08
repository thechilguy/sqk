import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { UiModule } from './ui/ui.module';

@Module({
  imports: [AuthModule, UsersModule, UiModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
