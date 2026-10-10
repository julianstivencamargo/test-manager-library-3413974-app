# test-manager-library-3413974-app — Aplicación de Gestión (React)

Frontend SPA en React para la gestión integral de **Manager Library** (Ficha ADSO 3413974 — T-22).

## Funcionalidades Implementadas

1. **Autenticación JWT:**
   - Inicio de sesión con credenciales (`admin` o `librarian`).
   - Token almacenado en almacenamiento local con expiración de 8 horas.
   - Restricción visual de acciones según rol.

2. **Catálogo de Libros:**
   - Exploración paginada con búsqueda predictiva por texto (título/autor) y filtro por categoría.
   - Visualización de ISBN-13 y stock disponible en tiempo real.
   - Creación y baja lógica de libros (exclusivo rol `admin`).

3. **Socios:**
   - Búsqueda y listado de socios registrados.
   - Registro de nuevos socios con cédula/documento único.

4. **Préstamos:**
   - Registro de préstamos multi-línea (1 a 3 libros por operación).
   - Inclusión de socios validados.
   - Listado con estados calculados en tiempo real (`open`, `overdue`, `closed`).
   - Devolución individual por línea con actualización inmediata de stock disponible.

5. **Libros Vencidos:**
   - Panel operativo para bibliotecarios y administradores.
   - Muestra líneas sin devolver cuyo plazo de 14 días venció, ordenadas por mayor retraso.

6. **Reportes (Admin):**
   - Ranking de libros más prestados por rango de fechas (desde/hasta).
   - Conservación inmutable de títulos y categorías congeladas en el préstamo (ADR-004).

## Ejecución

### Con Docker Compose (Recomendado)
Inicie la infraestructura completa desde `test-manager-library-3413974-infra`. La aplicación estará disponible en `http://localhost:3000`.

### Modo Desarrollo Local
```bash
npm install
npm run dev
```
Acceda a `http://localhost:3000`.
