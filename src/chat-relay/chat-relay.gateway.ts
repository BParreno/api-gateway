// src/chat-relay/chat-relay.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { io, Socket as ClientSocket } from 'socket.io-client';
import { ConfigService } from '@nestjs/config';
import { Logger, OnModuleInit } from '@nestjs/common'; // OnModuleInit se importa de @nestjs/common

@WebSocketGateway({
  cors: {
    origin: '*', // Permite conexiones desde cualquier origen para el frontend
  },
})
export class ChatRelayGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  @WebSocketServer()
  server: Server; // Servidor WebSocket del API Gateway (para clientes frontend)

  private chatAppClient: ClientSocket; // Cliente WebSocket del API Gateway (para conectarse al chat-app)
  private readonly logger = new Logger(ChatRelayGateway.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const chatAppUrl = this.configService.get<string>('CHAT_APP_URL');
    this.logger.log(`[ChatRelayGateway] Conectando al chat-app original en: ${chatAppUrl}`);

    this.chatAppClient = io(chatAppUrl);

    this.chatAppClient.on('chatMessage', (data: { senderId: string; message: string }) => {
      this.logger.debug(`[ChatRelayGateway] Reenviando de chat-app: ${data.senderId}: ${data.message}`);
      this.server.emit('chatMessage', data);
    });

    this.chatAppClient.on('userConnected', (msg: string) => {
      this.logger.debug(`[ChatRelayGateway] Reenviando de chat-app: ${msg}`);
      this.server.emit('userConnected', msg);
    });

    this.chatAppClient.on('userDisconnected', (msg: string) => {
      this.logger.debug(`[ChatRelayGateway] Reenviando de chat-app: ${msg}`);
      this.server.emit('userDisconnected', msg);
    });

    this.chatAppClient.on('connect', () => {
      this.logger.log(`[ChatRelayGateway] Conectado exitosamente al chat-app original.`);
    });

    this.chatAppClient.on('disconnect', (reason) => {
      this.logger.warn(`[ChatRelayGateway] Desconectado del chat-app original: ${reason}`);
    });

    this.chatAppClient.on('connect_error', (error) => {
      this.logger.error(`[ChatRelayGateway] Error de conexión al chat-app original: ${error.message}`);
    });
  }

  handleConnection(client: Socket) {
    this.logger.log(`[ChatRelayGateway] Cliente frontend conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`[ChatRelayGateway] Cliente frontend desconectado: ${client.id}`);
  }

  @SubscribeMessage('chatMessage')
  handleMessage(
    @MessageBody() message: string,
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.debug(`[ChatRelayGateway] Mensaje de cliente frontend ${client.id}: ${message}`);
    this.chatAppClient.emit('chatMessage', message);
  }
}