// src/main.ts del proyecto api-gateway
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger, HttpStatus } from '@nestjs/common';
import * as express from 'express'; // Importa express para los tipos y para express.json()

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('API Gateway');

  const gatewayPort = configService.get<number>('GATEWAY_PORT') || 3000;
  const graphqlApiUrl = configService.get<string>('GRAPHQL_API_URL') || 'http://localhost:4000';

  app.enableCors();
  app.use(express.json()); // <--- ¡AÑADE ESTA LÍNEA! Para parsear el cuerpo de las peticiones JSON

  // --- Proxy para la API GraphQL (Usando fetch directo con req.originalUrl) ---
  app.use('/graphql', async (req: express.Request, res: express.Response) => {
    const targetUrl = `${graphqlApiUrl}${req.originalUrl}`; // Usa req.originalUrl para la ruta completa
    logger.debug(`[Proxy GraphQL] Proxying request: ${req.method} ${req.originalUrl} -> ${targetUrl}`);

    let requestBody: string | undefined = undefined;
    // req.body ya debería estar parseado por express.json()
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      try {
        requestBody = JSON.stringify(req.body);
      } catch (e: any) {
        logger.error(`[Proxy GraphQL] Error al serializar el cuerpo de la petición: ${e.message}`);
        return res.status(HttpStatus.BAD_REQUEST).json({
          message: 'Error al procesar el cuerpo de la petición.',
          error: e.message,
        });
      }
    }

    const headers: HeadersInit = {};
    for (const key in req.headers) {
      const headerValue = req.headers[key];
      if (headerValue !== undefined &&
          key.toLowerCase() !== 'host' &&
          key.toLowerCase() !== 'connection' &&
          key.toLowerCase() !== 'content-length') {
        headers[key] = Array.isArray(headerValue) ? headerValue.join(',') : headerValue;
      }
    }
    if (req.method === 'POST' && !headers['content-type']) {
      headers['content-type'] = 'application/json';
    }

    try {
      const proxyRes = await fetch(targetUrl, {
        method: req.method,
        headers: headers,
        body: requestBody,
      });

      proxyRes.headers.forEach((value, name) => {
        res.setHeader(name, value);
      });
      res.status(proxyRes.status);
      const body = await proxyRes.text();
      res.send(body);

    } catch (error: any) {
      logger.error(`[Proxy GraphQL] Error al proxyar GraphQL: ${error.message}`);
      if (!res.headersSent) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          message: 'Error de Proxy para la API GraphQL',
          error: error.message,
        });
      }
    }
  });

  // Inicia el servidor HTTP de NestJS (y el servidor WebSocket del Gateway)
  await app.listen(gatewayPort);
  console.log(`API Gateway escuchando peticiones HTTP y WebSockets en el puerto ${gatewayPort}`);

  // --- La lógica del puente WebSocket ya está en ChatRelayGateway ---
  // No necesitamos configurar http-proxy aquí para WebSockets.
}
bootstrap();