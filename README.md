# El Escape de los Peluches

Juego web 3D con los tres escenarios originales en una distribución de mapa isométrico: habitación arriba a la izquierda, cocina arriba a la derecha y sala abajo. Los modelos GLB de los escenarios se cargan completos; el código únicamente aplica una escala uniforme al conjunto y lo coloca en el mapa, sin reconstruir ni reacomodar los muebles de cada modelo.

## Ejecutar

1. Descomprime la carpeta completa.
2. Abre la carpeta en Visual Studio Code.
3. Ejecuta `index.html` con la extensión **Live Server**.
4. Necesitas conexión a internet para cargar Three.js desde CDN.

## Controles

- Flechas o WASD: mover la vaca.
- E: interactuar / recoger llave.
- 1, 2 y 3: cambiar de escenario cuando el acceso esté desbloqueado.
- ESC: pausa.

## Modelos

Se incluyen los GLB originales de Habitación, Cocina, Sala, Vaca, Conejo y Oso en `models/`. La cámara permanece fija en perspectiva isométrica y muestra los tres escenarios al mismo tiempo.

Nota: las posiciones iniciales de los puntos interactivos y los colliders se pueden afinar si el origen o escala interna de alguno de los GLB difiere de lo esperado. Los muebles y sus posiciones dentro de los modelos originales no se editan.
