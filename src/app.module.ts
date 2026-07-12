import { Module, Controller, Get } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ServicesModule } from './services/services.module';
import { BookingsModule } from './bookings/bookings.module';
import { User } from './auth/entities/user.entity';
import { Service } from './services/entities/service.entity';
import { Booking } from './bookings/entities/booking.entity';


@Controller()
export class AppController {
  @Get()
  getHome() {
    return {
      status: 'success',
      message: 'Welcome to the Booking Platform API!',
      documentation: '/api/docs',
    };
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbType = configService.get<string>('DB_TYPE') || 'sqlite';

       if (dbType === 'postgres') {
          return {
            type: 'postgres',
        
            url: configService.get<string>('DATABASE_URL'),
        
            entities: [User, Service, Booking],
        
            synchronize: true,
          };
        }

        // Default to SQLite
        return {
          type: 'sqlite',
          database: configService.get<string>('DB_DATABASE') || 'database.sqlite',
          entities: [User, Service, Booking],
          synchronize: true,
        };
      },
    }),
    AuthModule,
    ServicesModule,
    BookingsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
