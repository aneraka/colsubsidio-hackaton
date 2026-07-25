# MVP Inventario - Colsubsidio

Este es el repositorio del MVP de inventario, desarrollado con React, Vite, Tailwind CSS y Supabase.

## 🛠 Prerrequisitos

Para levantar este proyecto en tu máquina, necesitas tener instalado:
* [Node.js](https://nodejs.org/) (o [Bun](https://bun.sh/))
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) (debe estar abierto y corriendo)
* [Git](https://git-scm.com/)

---

## 🚀 Configuración del Entorno Local

Sigue estos pasos para levantar el frontend y la base de datos local:

### Paso 1: Instalar dependencias
Abre la terminal en la raíz del proyecto y ejecuta:
\`\`\`bash
npm install
# o si usas bun: bun install
\`\`\`

### Paso 2: Configurar las variables de entorno
1. Crea un archivo llamado \`.env\` en la raíz del proyecto.
2. Copia y pega las siguientes variables (son las credenciales por defecto de Supabase local):

\`\`\`env
SUPABASE_PROJECT_ID="local"
SUPABASE_URL="http://127.0.0.1:54321"
SUPABASE_PUBLISHABLE_KEY="<AQUÍ_VA_LA_ANON_KEY_LOCAL>"

VITE_SUPABASE_PROJECT_ID="local"
VITE_SUPABASE_URL="http://127.0.0.1:54321"
VITE_SUPABASE_PUBLISHABLE_KEY="<AQUÍ_VA_LA_ANON_KEY_LOCAL>"
\`\`\`
*(Nota: Obtendrás la clave \`ANON_KEY\` exacta al ejecutar el siguiente paso).*

### Paso 3: Levantar la Base de Datos Local (Supabase)
Inicia los contenedores de Docker con la CLI de Supabase:
\`\`\`bash
npx supabase start
\`\`\`
Al finalizar, la terminal te mostrará tus credenciales locales. Reemplaza el valor de \`SUPABASE_PUBLISHABLE_KEY\` y \`VITE_SUPABASE_PUBLISHABLE_KEY\` en tu archivo \`.env\` con la **anon key** que te arroje la terminal.

Para asegurarte de tener las últimas tablas y estructura de la base de datos, ejecuta:
\`\`\`bash
npx supabase db reset
\`\`\`

### Paso 4: Levantar el servidor de desarrollo
Finalmente, inicia la aplicación web:
\`\`\`bash
npm run dev
# o bun run dev
\`\`\`
Abre [http://localhost:8080](http://localhost:8080) (o el puerto que te indique Vite) en tu navegador.