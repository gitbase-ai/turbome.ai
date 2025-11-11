import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { FilesModule } from './modules/files/files.module';
import { CommitsModule } from './modules/commits/commits.module';
import { GitModule } from './modules/git/git.module';
import { SearchModule } from './modules/search/search.module';
import { WorkspaceModule } from './modules/workspace/workspace.module';
import { V1GitModule } from './modules/v1/git/git.module';
import { V1SearchModule } from './modules/v1/search/search.module';
import { V1WorkspaceModule } from './modules/v1/workspace/workspace.module';
import { V1FilesModule } from './modules/v1/files/files.module';
import { V2RepoModule } from './modules/v2/repos/repos.module';
import { V2WorkspaceModule } from './modules/v2/workspace/workspace.module';
import { V2ContentModule } from './modules/v2/content/content.module';
import { V2SearchModule } from './modules/v2/search/search.module';

const isProd = process.env.NODE_ENV === 'production';

@Module({
  imports: [
    UsersModule,
    FilesModule,
    CommitsModule,
    GitModule,
    SearchModule,
    WorkspaceModule,
    V1GitModule,
    V1SearchModule,
    V1WorkspaceModule,
    V1FilesModule,
    V2WorkspaceModule,
    V2ContentModule,
    V2RepoModule,
    V2SearchModule,
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