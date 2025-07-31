// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { FamilleModule } from './famille/famille.module';
import { GroupeModule } from './groupe/groupe.module';
import { ActifModule } from './actif/actif.module';
import { TypeInspectionModule } from './type-inspection/type-inspection.module';
import { InspectionModule } from './inspection/inspection.module';
import { LivrableModule } from './livrable/livrable.module';
import { UtilisateurModule } from './utilisateur/utilisateur.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'password'),
        database: configService.get('DB_NAME', 'gestion_inspections'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    FamilleModule,
    GroupeModule,
    ActifModule,
    TypeInspectionModule,
    InspectionModule,
    LivrableModule,
    UtilisateurModule,
    DashboardModule,
    //HistoriqueEtatInspectionModule, 
  ],
})
export class AppModule {}