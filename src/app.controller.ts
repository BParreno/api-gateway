// src/app.controller.ts del proyecto api-gateway
import { Controller, Get, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express'; // Importa Response de express
import { TimeServiceClient } from './time-service-client/time-service-client.service'; // Importa el servicio cliente de tiempo

@Controller()
export class AppController {
  constructor(private readonly timeServiceClient: TimeServiceClient) {}

  // Endpoint HTTP para solicitar la hora al microservicio de tiempo
  @Get('time')
  async getTime(@Res() res: Response): Promise<void> {
    try {
      const currentTime = await this.timeServiceClient.getTime();
      res.status(HttpStatus.OK).json({ time: currentTime });
    } catch (error) {
      console.error('[AppController] Error al procesar la solicitud /time:', error.message);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Error al obtener la hora del microservicio.',
        error: error.message,
      });
    }
  }

  // Los endpoints para GraphQL y WebSockets (chat) son manejados por los proxies en main.ts
  // No necesitan lógica de controlador aquí.
}