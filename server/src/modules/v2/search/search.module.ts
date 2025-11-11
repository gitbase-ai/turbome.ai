import { Module } from '@nestjs/common';
import { V2SearchController } from './search.controller';
import { V2SearchService } from './search.service';
import { V2ConfigModule } from '../config/config.module';

@Module({
  imports: [V2ConfigModule],
  controllers: [V2SearchController],
  providers: [V2SearchService],
  exports: [V2SearchService]
})
export class V2SearchModule {}
