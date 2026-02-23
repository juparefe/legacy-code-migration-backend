# Legacy Code Migration Backend

Este es el repositorio frontend de la aplicacion web para la migracion de codigo legacy, 
Tienes dos opciones para probarlo:
* Utilizar [Postman](https://www.postman.com/) u otra herramienta para testear APIs que permita enviar peticiones y recibir las respuestas.
* Utilizar el front diseñado para utilizar esta aplicacion, para hacerlo puedes seguir las instrucciones del [Repositorio Legacy Code Migration Frontend](https://github.com/juparefe/legacy-code-migration-frontend))

## Requisitos Previos

Asegúrate de tener instalado lo siguiente:

- Node.js: [Descargar Node.js](https://nodejs.org/)
- npm (administrador de paquetes de Node.js): Viene incluido con Node.js

**Lenguajes utilizados:** TypeScript  
**Frameworks, herramientas o librerias utilizados:** Express.js, Node.js, Zod

## Scripts Disponibles
* Instalar Dependencias: `npm install`
* Construir la Aplicación: `npm run build`
* Revisar el codigo: `npm run lint`
* Correr los test unitarios: `npm run test`
* Correr los test unitarios y ver cobertura: `npm run test:cov`
* Construir el archivo .zip de la Aplicación por si se quiere actualizar manualmente la lambda: `npm run package:lambda`
* Iniciar la Aplicación: `npm start`

## Paso a paso para ejecutar el repositorio
* Clonar el repositorio en el entorno local utilizando el comando 
```
git clone https://github.com/juparefe/legacy-code-migration-backend.git
```
* Abrir la carpeta clonada utilizando algun editor de codigo
* Instala las dependencias:
```
npm install
```
* Ejecuta el siguiente comando para iniciar el servidor:
```
npm start
```
- Para saber que el servidor se inicio correctamente en la consola debe aparecer el mensaje "Servidor corriendo en el puerto 3001"

### Ejecutar los endpoints:
- Si se siguieron los pasos anteriores, la API se esta ejecutando en la direccion: ```http://localhost:3000 ```

