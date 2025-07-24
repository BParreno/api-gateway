// src/chat-relay/chat-relay.module.ts
import { Module } from '@nestjs/common';
import { ChatRelayGateway } from './chat-relay.gateway';

@Module({
  providers: [ChatRelayGateway],
})
export class ChatRelayModule {}