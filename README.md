# El Escape de los Peluches

Juego web 3D hecho con HTML, CSS, JavaScript y Three.js. La vista general presenta los tres escenarios grandes en la misma distribución de la referencia: habitación arriba a la izquierda, cocina arriba a la derecha y sala abajo. Los personajes tienen una escala media para que se distingan sin reducir el tamaño de los escenarios.

## Ejecutar
1. Abre esta carpeta en Visual Studio Code.
2. Ejecuta `index.html` con Live Server; o abre una terminal en esta carpeta y ejecuta `python -m http.server 8000`.
3. Entra a `http://localhost:8000`.

Se requiere conexión a internet para cargar Three.js desde jsDelivr.

## Controles
- Flechas o WASD: mover a la vaca.
- E: interactuar con objetos.
- ESC: pausa.
- Botones de pisos o teclas 1, 2 y 3: cambiar de escenario cuando se haya desbloqueado el acceso.

## Progreso del juego
- Habitación: llave dorada debajo de la cama.
- Cocina: el conejo ayuda a alcanzar la llave azul del refrigerador.
- Sala: llave verde dentro de la taza.
- Final: en la puerta de la sala se prueban las llaves dorada, verde y azul, en ese orden. La azul abre la salida.
- El oso comienza a perseguir después de unos segundos.

## Modelos
Los personajes se cargan desde `models/`. Las habitaciones se construyen como escenarios 3D amplios dentro del HTML/JavaScript para conservar la distribución y lectura visual de la referencia. Algunos archivos GLB de escenario recibidos en la última carga están duplicados entre sí o contienen un objeto aislado en lugar de la habitación completa, por lo que no se usan como sustitutos de los escenarios.
