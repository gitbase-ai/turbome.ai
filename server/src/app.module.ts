import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { V2RepoModule } from './modules/v2/repos/repos.module';
import { V2WorkspaceModule } from './modules/v2/workspace/workspace.module';
import { V2ContentModule } from './modules/v2/content/content.module';
import { V2SearchModule } from './modules/v2/search/search.module';
import { V2TreeModule } from './modules/v2/tree/tree.module';

const isProd = process.env.NODE_ENV === 'production';

@Module({
  imports: [
    V2WorkspaceModule,
    V2ContentModule,
    V2RepoModule,
    V2SearchModule,
    V2TreeModule,
    // 生产环境下提供静态文件服务
    ...(isProd ? [
      ServeStaticModule.forRoot({
        rootPath: join(__dirname, '..', '..', '..', 'client'),
        exclude: ['/api*'],
      }),
    ] : []),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}