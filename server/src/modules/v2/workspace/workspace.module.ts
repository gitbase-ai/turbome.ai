import { Module } from '@nestjs/common';
import { V2WorkspaceController } from './workspace.controller';
import { V2WorkspaceService } from './workspace.service';
import { V2ConfigModule } from '../config/config.module';

@Module({
  imports: [V2ConfigModule],
  controllers: [V2WorkspaceController],
  providers: [V2WorkspaceService],
  exports: [V2WorkspaceService],
})
export class V2WorkspaceModule {}
