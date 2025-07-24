// src/app.module.ts del proyecto api-gateway
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TimeServiceClient } from './time-service-client/time-service-client.service';
import { ChatRelayModule } from './chat-relay/chat-relay.module'; // <-- ¡Añade esta línea!

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ChatRelayModule, // <-- ¡Añade esta línea!
  ],
  controllers: [AppController],
  providers: [AppService, TimeServiceClient],
})
export class AppModule {}