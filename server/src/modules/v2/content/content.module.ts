import { Module } from '@nestjs/common';
import { V2ContentController } from './content.controller';
import { V2ContentService } from './content.service';
import { V2ConfigModule } from '../config/config.module';

@Module({
  imports: [V2ConfigModule],
  controllers: [V2ContentController],
  providers: [V2ContentService],
  exports: [V2ContentService],
})
export class V2ContentModule {}
