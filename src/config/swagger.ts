// swagger.ts
import swaggerJSDoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.1.0",
    info: { title: "Eco Accounts API", version: "1.0.0" },
    servers: [{ url: "http://localhost:3003/api" }],
  },
  apis: ["./src/controllers/**/*.ts"], // <-- ruta a tus controladores
});
