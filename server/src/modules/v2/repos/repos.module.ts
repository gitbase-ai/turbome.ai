import { Module } from '@nestjs/common';
import { ReposController } from './repos.controller';
import { RepoController } from './repo.controller';
import { ReposService } from './repos.service';
import { V2ConfigModule } from '../config/config.module';

@Module({
  imports: [V2ConfigModule],
  controllers: [ReposController, RepoController],
  providers: [ReposService],
  exports: [ReposService],
})
export class V2RepoModule {}
