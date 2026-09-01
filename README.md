# Tablero Ingeniería en Multimedia — UMNG

Tablero interactivo en HTML para el análisis del programa de **Ingeniería en Multimedia** de la Universidad Militar Nueva Granada.

## Contenido

- `index.html`: tablero principal, listo para publicar con GitHub Pages.
- `data/`: archivos fuente utilizados para construir las visualizaciones.
- `assets/`: recursos gráficos de apoyo.
- `.gitignore`: exclusiones básicas para Git.

## Publicación con GitHub Pages

1. Crear un repositorio nuevo en GitHub.
2. Cargar todo el contenido de esta carpeta en la raíz del repositorio.
3. Ir a **Settings → Pages**.
4. En **Build and deployment**, seleccionar:
   - **Source:** Deploy from a branch
   - **Branch:** `main`
   - **Folder:** `/ (root)`
5. Guardar los cambios.
6. GitHub publicará automáticamente el archivo `index.html`.

## Visualizaciones incluidas

- Visión general del programa.
- Evolución por semestre.
- Comparación de instituciones.
- Matriculados por departamento.
- Participación UMNG frente al mercado comparable.
- Distribución del IBC estimado.
- Vinculación laboral / tasa de cotizantes.
- Comparativo de programas.
- Tabla de datos y exportación CSV.

## Datos

El tablero utiliza información suministrada en archivos SNIES, IBC/OLE y vinculación laboral.

## Nota

El `index.html` utiliza Plotly desde CDN y contiene embebidos los datos necesarios para las visualizaciones, por lo que puede publicarse directamente mediante GitHub Pages.