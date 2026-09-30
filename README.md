# Betortuga 🐢

Juego de tablero web, estilo compra-venta de propiedades, con tema de
tortugas y una laguna. Un jugador humano compite contra bots.

## Cómo jugar

No requiere instalación ni dependencias: es HTML/CSS/JS puro.

1. Sirve la carpeta con cualquier servidor estático, por ejemplo:
   ```
   python3 -m http.server 8000
   ```
2. Abre `http://localhost:8000/index.html` en el navegador.
3. Elige tu nombre y el número de bots (1 a 3) y presiona "Comenzar partida".

## Reglas del prototipo (v1)

- 40 casillas: propiedades, 4 embarcaderos, 2 servicios (agua/luz),
  impuestos, Suerte, Caja Comunal, Salida, Caparazón (cárcel) y descanso.
- Compra propiedades libres al caer en ellas; paga renta si son de otro jugador.
- La renta de un grupo de color se duplica si el dueño tiene todas las
  propiedades de ese grupo (sin construcción de casas/hoteles todavía).
- Sacar dobles da otro turno; 3 dobles seguidos mandan al Caparazón.
- Un jugador queda eliminado si su dinero baja de 0. Gana quien quede en pie.

## Estructura del proyecto

- `index.html` — pantallas de inicio y de juego.
- `css/styles.css` — estilos del tablero y la interfaz.
- `js/board-data.js` — casillas del tablero y cartas de Suerte/Caja Comunal.
- `js/game.js` — lógica del juego (turnos, dados, compra/renta, cárcel, bots).
- `js/ui.js` — renderizado del tablero, paneles y controles.
- `js/main.js` — arranque de la partida.

## Ideas para siguientes iteraciones

- Construcción de casas/hoteles y su efecto en la renta.
- Hipotecar propiedades para conseguir liquidez.
- Modo multijugador local (varios humanos por turnos) u online.
- Animaciones de movimiento del token y sonido.
