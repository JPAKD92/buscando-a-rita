# 🐱 Buscando a Rita

Juego educativo/aventura para niños hecho con HTML, CSS y JavaScript puro.

## ¿De qué se trata?

Rita es una gatita blanca con manchas marrones y negras que se escondió en la casa. Elegí jugar con **Justina** o **León** y recorré 5 escenarios respondiendo preguntas para juntar pistas y encontrarla.

## Cómo jugar

1. Abrí `index.html` en cualquier navegador
2. Elegí tu personaje
3. Respondé las preguntas en cada nivel
4. Juntá pistas y encontrá a Rita

## Subir a GitHub Pages

1. Creá un repositorio en GitHub
2. Subí los archivos:
   ```bash
   git init
   git add .
   git commit -m "Buscando a Rita - juego educativo"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/buscando-a-rita.git
   git push -u origin main
   ```
3. Andá a **Settings** → **Pages** en tu repositorio
4. En **Source** seleccioná la rama `main` y la carpeta `/ (root)`
5. Hacé clic en **Save**
6. En unos minutos tu juego estará disponible en `https://TU-USUARIO.github.io/buscando-a-rita/`

## Estructura

```
├── index.html    → Estructura del juego
├── styles.css    → Estilos visuales
├── script.js     → Lógica y banco de preguntas
└── README.md     → Este archivo
```

## Personalización

Las preguntas están en el objeto `questionBank` dentro de `script.js`. Cada nivel tiene 20 preguntas editables con formato:

```js
{ q: "Pregunta", options: ["A", "B", "C", "D"], correct: 1, explanation: "Explicación" }
```

## Tecnologías

HTML5 + CSS3 + JavaScript vanilla. Sin dependencias externas.
