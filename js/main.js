// Betortuga — arranque de la partida

document.getElementById('start-btn').addEventListener('click', () => {
  const nameInput = document.getElementById('player-name').value.trim() || 'Jugador';
  const botCount = parseInt(document.getElementById('bot-count').value, 10);
  const botNames = ['Tortobot', 'Concha-3000', 'Caparazón IA'].slice(0, botCount);

  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('game-screen').classList.remove('hidden');

  const game = new Game([nameInput, ...botNames]);
  window.__betortugaGame = game;
  game.run();
});
