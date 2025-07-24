# 🧑‍💻 API Gateway con NestJS

Este proyecto implementa un **API Gateway** robusto y escalable utilizando **NestJS**, diseñado para unificar el acceso a diversos microservicios y APIs distribuidas. Su función principal es actuar como un único punto de entrada para los clientes, centralizando la gestión de peticiones, enrutándolas a los servicios adecuados y realizando la traducción de protocolos cuando sea necesario.

El Gateway simplifica la interacción para los clientes externos al ofrecer una interfaz consistente, mientras que internamente se comunica eficientemente con los distintos componentes del sistema.

## 🚀 Tecnologías Utilizadas

* **NestJS:** Un framework progresivo de Node.js para construir aplicaciones del lado del servidor escalables y eficientes, siguiendo principios de arquitectura modular.
* **TypeScript:** Lenguaje de programación que añade tipado estático a JavaScript, mejorando la robustez y mantenibilidad del código.
* **`@nestjs/microservices`:** Módulo de NestJS esencial para la comunicación entre microservicios, soportando varios transportes como TCP, Redis y NATS.
* **`socket.io`:** Librería popular para habilitar la comunicación en tiempo real bidireccional basada en eventos, utilizada para la gestión de WebSockets.
* **`socket.io-client`:** Cliente de `socket.io` que permite al Gateway conectarse a otros servidores Socket.IO, facilitando el puenteo de la comunicación en tiempo real.
* **`http-proxy-middleware`:** Middleware de proxy para NestJS (basado en Express), utilizado para reenviar peticiones HTTP a la API GraphQL.
* **`Docker`:** Plataforma de contenedores utilizada para el despliegue rápido y consistente de los servidores de mensajería (Redis y NATS).

## 📡 Detalles del API Gateway

* **Rol:** Unificador de puntos de acceso, enrutador de tráfico, y traductor de protocolos. Provee una interfaz externa consistente para múltiples servicios internos.
* **Puerto de Escucha del Gateway:** `3000` (Este es el puerto principal para HTTP y WebSockets).
* **Métodos de Comunicación Soportados:**
    * **HTTP:** Para la exposición de endpoints RESTful y el proxying de la API GraphQL.
    * **WebSockets:** Para la gestión de la comunicación en tiempo real con clientes de chat.
    * **TCP, Redis, NATS:** Para la comunicación interna con el microservicio de tiempo, permitiendo flexibilidad en la infraestructura de mensajería.
* **Servicios Integrados:**
    * **Microservicio de Tiempo (`time-microservice`):** Provee la hora actual mediante RPC.
    * **Aplicación de Chat (`realtime-chat`):** Permite la comunicación en tiempo real entre usuarios.
    * **API GraphQL (`mi-api-graphql-libros`):** Ofrece operaciones de consulta y mutación para la gestión de datos de libros.

## ⚙️ Estructura de Componentes Clave

El proyecto `api-gateway` se organiza en los siguientes componentes principales:

* **`src/main.ts`**: Archivo de entrada de la aplicación NestJS. Configura el servidor HTTP y el proxy para GraphQL, además de inicializar la aplicación y sus módulos.
* **`src/app.module.ts`**: Módulo raíz que define la estructura principal de la aplicación, importando otros módulos y registrando controladores y proveedores.
* **`src/app.controller.ts`**: Contiene la lógica para las rutas HTTP expuestas directamente por el Gateway, como el endpoint `/time` para el microservicio de tiempo.
* **`src/time-service-client/time-service-client.service.ts`**: Un servicio cliente que abstrae la comunicación con el `time-microservice`. Se encarga de conectar y enviar mensajes al microservicio de tiempo, adaptándose dinámicamente al transporte configurado (TCP, Redis, NATS).
* **`src/chat-relay/chat-relay.module.ts`**: Módulo específico para encapsular la lógica del puente WebSocket del chat.
* **`src/chat-relay/chat-relay.gateway.ts`**: Implementa un `WebSocketGateway` para el Gateway. Actúa como un servidor WebSocket para los clientes frontend y, simultáneamente, como un cliente WebSocket (`socket.io-client`) que se conecta a la aplicación de chat original. Su función es reenviar mensajes bidireccionalmente entre los clientes del Gateway y el servidor de chat principal.

## 📦 Archivos Clave del Proyecto

Aquí se presentan los contenidos de los archivos más relevantes para la configuración y operación del API Gateway:

### `src/main.ts` (API Gateway)

```typescript
// src/main.ts del proyecto api-gateway
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger, HttpStatus } from '@nestjs/common';
import * as express from 'express'; // Importa express para los tipos de Request y Response
import { createProxyMiddleware } from 'http-proxy-middleware'; // Importa http-proxy-middleware

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('API Gateway');

  const gatewayPort = configService.get<number>('GATEWAY_PORT') || 3000;
  const graphqlApiUrl = configService.get<string>('GRAPHQL_API_URL') || 'http://localhost:4000';

  app.enableCors();
  app.use(express.json()); // Asegura que el cuerpo de las peticiones JSON sea parseado

  // --- Proxy para la API GraphQL con http-proxy-middleware ---
  const graphqlProxy = createProxyMiddleware({
    target: graphqlApiUrl,
    changeOrigin: true, // Importante para el proxy
  });
  app.use('/graphql', graphqlProxy);

  // Inicia el servidor HTTP de NestJS (y el servidor WebSocket del Gateway)
  await app.listen(gatewayPort);
  console.log(`API Gateway escuchando peticiones HTTP y WebSockets en el puerto ${gatewayPort}`);

  // --- La lógica del puente WebSocket está en ChatRelayGateway ---
}
bootstrap();