// src/time-service-client/time-service-client.service.ts del proyecto api-gateway
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TimeServiceClient implements OnModuleInit, OnModuleDestroy {
  private client: ClientProxy;
  private readonly logger = new Logger(TimeServiceClient.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const transportType = this.configService.get<string>('TRANSPORT_TYPE');
    this.logger.log(`[TimeServiceClient] Configurando cliente para transporte: ${transportType}`);

    let clientOptions: any;

    switch (transportType) {
      case 'TCP':
        clientOptions = {
          transport: Transport.TCP,
          options: {
            host: this.configService.get<string>('TIME_MICROSERVICE_HOST'),
            port: this.configService.get<number>('TIME_MICROSERVICE_PORT'),
          },
        };
        break;
      case 'REDIS':
        clientOptions = {
          transport: Transport.REDIS,
          options: {
            host: this.configService.get<string>('REDIS_HOST'),
            port: this.configService.get<number>('REDIS_PORT'),
          },
        };
        break;
      case 'NATS':
        clientOptions = {
          transport: Transport.NATS,
          options: {
            servers: [this.configService.get<string>('NATS_URL')],
          },
        };
        break;
      default:
        throw new Error(`[TimeServiceClient] Tipo de transporte no soportado: ${transportType}`);
    }

    this.client = ClientProxyFactory.create(clientOptions);
    // Conecta el cliente proxy. Usamos .then/.catch para loguear el estado de la conexión.
    this.client.connect()
      .then(() => this.logger.log(`[TimeServiceClient] Cliente conectado vía ${transportType}`))
      .catch(err => this.logger.error(`[TimeServiceClient] Fallo al conectar cliente vía ${transportType}: ${err.message}`));
  }

  onModuleDestroy() {
    // Cierra la conexión del cliente proxy cuando el módulo se destruye
    this.client.close();
    this.logger.log('[TimeServiceClient] Cliente desconectado.');
  }

  // Método para enviar el comando 'get_time' al microservicio de tiempo
  async getTime(): Promise<string> {
    this.logger.log('[TimeServiceClient] Enviando comando "get_time" al microservicio de tiempo...');
    // El 'get_time' es el patrón que el time-microservice espera
    return this.client.send('get_time', {}).toPromise();
  }
}