# Mis Arepitas Salseras — sitio web

Sitio web responsivo, preparado para GitHub Pages. Construido con **HTML, CSS y JavaScript sin frameworks**, sin backend ni base de datos externa.

## Qué incluye

- Portada con identidad visual del restaurante y fotografías entregadas.
- Carta digital con nombres, descripciones, categorías y precios en pesos colombianos.
- Búsqueda y filtros de productos.
- Carrito de pedido que arma automáticamente un mensaje de WhatsApp.
- Tres sedes con enlaces para consultar sus ubicaciones.
- Enlaces de WhatsApp al **313 820 5676**, **317 508 7392** y **350 205 4200**, todos presentes en el material compartido.
- Administrador de productos y precios con funciones de **crear, consultar, modificar, ocultar y eliminar**.
- Conexión opcional desde el administrador a GitHub mediante un token personal introducido en el momento.
- Carpeta `assets/menu-original/` con las páginas originales de la carta, como respaldo de referencia.

## Publicarlo gratis en GitHub Pages

1. Crea un repositorio en [GitHub](https://github.com/new). Puedes llamarlo `mis-arepitas-salseras`.
2. **Extrae el ZIP** y sube el contenido de la carpeta `mis-arepitas-salseras/` a la **raíz** del repositorio. En la raíz debe quedar `index.html`, no una carpeta adicional encima.
3. Haz commit de todos los archivos.
4. Ve a **Settings → Pages → Build and deployment**.
5. Selecciona **Deploy from a branch**, la rama `main` y la carpeta `/ (root)`. Guarda.
6. Espera el enlace de GitHub Pages y entra al sitio.

En un repositorio público de nombre `mis-arepitas-salseras`, la URL será aproximadamente:

`https://TU-USUARIO.github.io/mis-arepitas-salseras/`

El sitio usa rutas relativas, por lo que funciona bajo el subdirectorio de GitHub Pages.

## Probarlo en tu computador

No abras `index.html` haciendo doble clic si quieres usar el menú dinámico: algunos navegadores bloquean la lectura local de `data/menu.json`.

Abre una terminal en la carpeta del proyecto y ejecuta:

```bash
python -m http.server 8000
```

Luego visita `http://localhost:8000/`. En VS Code puedes utilizar la extensión Live Server.

## Editar precios y productos sin tocar el código

Abre **`admin.html`** desde el sitio publicado o desde el servidor local.

### Opción A: edición conectada a GitHub

1. En GitHub ve a **Settings → Developer settings → Personal access tokens → Fine-grained tokens**.
2. Crea un token nuevo para **solo este repositorio**, con acceso a **Contents: Read and write**. Usa un vencimiento corto. Si tu organización necesita aprobar el token, solicita esa aprobación.
3. En `admin.html` escribe el usuario/organización, el nombre del repositorio, la rama (`main` normalmente) y el token.
4. Selecciona **Conectar y cargar**. Verás los productos actuales de `data/menu.json`.
5. Cambia precios, crea productos, modifica ingredientes, oculta artículos o elimina entradas.
6. Pulsa **Publicar cambios en GitHub**. Se guardará un commit que modifica `data/menu.json`.
7. Espera a que GitHub Pages publique la nueva versión (puede tardar algunos minutos) y recarga la web.

El administrador no necesita saber ni almacenar tu contraseña de GitHub. Utiliza la [API oficial de contenido de repositorios](https://docs.github.com/en/rest/repos/contents#update-a-file) para modificar únicamente `data/menu.json`.

**Importante sobre la seguridad:** `admin.html` es una página pública si tu repositorio es público; la seguridad de escritura depende exclusivamente de las autorizaciones del token. No hay un inicio de sesión propio ni un servidor privado. El token **no está escrito en el código, no se envía a terceros y no se guarda en `localStorage`**: permanece en la memoria de la pestaña hasta cerrarla. No uses el editor en equipos de terceros o con extensiones de navegador que no sean de confianza. Nunca pongas el token en la URL ni lo subas al repositorio. Si necesitas un panel privado multiusuario, deberás agregar autenticación y un backend seguro.

### Opción B: edición local sin GitHub

1. Abre `admin.html` desde un servidor local.
2. Pulsa **Editar menú local**.
3. Realiza los cambios y haz clic en **Descargar JSON**.
4. Sustituye el archivo `data/menu.json` por el archivo descargado.
5. Sube el cambio a GitHub para que se actualice el sitio.

## Dónde modificar otros datos

| Contenido | Archivo |
| --- | --- |
| Productos, precios, ingredientes y categorías | `data/menu.json` / `admin.html` |
| Número de WhatsApp, sedes y textos generales | `index.html` |
| Colores, tipografía, animaciones, diseño responsivo | `css/styles.css` |
| Carrito de pedidos y búsqueda | `js/app.js` |
| Administrador GitHub y edición de precios | `js/admin.js` |
| Logo y fotografías | `assets/` |

## Datos que conviene confirmar antes de difundir

- La imagen de bebidas/sedes muestra **317 508 7392**, mientras otra pieza promocional muestra **350 205 4200**. Por precaución se incluyeron ambos junto al número repetido **313 820 5676**. Confirma cuáles están activos y elimina el que no corresponda.
- Las tres direcciones aparecen en el menú sin municipio o ciudad explícitos. Los botones abren búsquedas de Maps con la dirección original; verifica las ubicaciones definitivas.
- El domicilio mínimo indicado en el menú es de **$15.000**. No se ha supuesto ningún costo de entrega, horario ni medio de pago fuera del material suministrado.
- Los productos tienen los precios de las imágenes compartidas. El diseño usa un catálogo de texto para que los cambios del administrador sí se reflejen, aunque las imágenes originales conservadas como respaldo mantendrán sus precios de la fecha del diseño.

---

Proyecto preparado para ser publicado en GitHub Pages sin compilación ni instalaciones adicionales.
