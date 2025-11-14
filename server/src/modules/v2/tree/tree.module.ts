import { Module } from '@nestjs/common';
import { TreeController } from './tree.controller';
import { TreeService } from './tree.service';
import { V2RepoModule } from '../repos/repos.module';

@Module({
  imports: [V2RepoModule],
  controllers: [TreeController],
  providers: [TreeService],
  exports: [TreeService],
})
export class V2TreeModule {}
