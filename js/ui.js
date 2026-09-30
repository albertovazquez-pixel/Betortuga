// Betortuga — capa de interfaz (renderizado del tablero, paneles y controles)

function gridPos(i) {
  if (i <= 10) return { row: 11, col: 11 - i };
  if (i <= 20) return { row: 11 - (i - 10), col: 1 };
  if (i <= 30) return { row: 1, col: (i - 20) + 1 };
  return { row: (i - 30) + 1, col: 11 };
}

const TYPE_ICON = {
  go: '➡️', tax: '💰', station: '🚤', chance: '❓', chest: '🎁',
  jail: '🔒', utility: '💧', parking: '🌴', gotojail: '🚨',
};

class UI {
  constructor(game) {
    this.game = game;
    this.boardEl = document.getElementById('board');
    this.playersEl = document.getElementById('players-panel');
    this.controlsEl = document.getElementById('controls-panel');
    this.logEl = document.getElementById('log-list');
  }

  renderBoard() {
    const { players } = this.game;
    this.boardEl.innerHTML = '';

    const center = document.createElement('div');
    center.className = 'board-center';
    center.innerHTML = '<div class="board-center-emoji">🐢</div><div class="board-center-title">BETORTUGA</div>';
    this.boardEl.appendChild(center);

    BOARD.forEach((space) => {
      const { row, col } = gridPos(space.id);
      const div = document.createElement('div');
      div.className = `space type-${space.type}`;
      div.style.gridRow = row;
      div.style.gridColumn = col;

      if (space.color) {
        const bar = document.createElement('div');
        bar.className = 'color-bar';
        bar.style.background = space.color;
        div.appendChild(bar);
      }

      const label = document.createElement('div');
      label.className = 'space-label';
      label.textContent = (TYPE_ICON[space.type] ? TYPE_ICON[space.type] + ' ' : '') + space.name;
      div.appendChild(label);

      const owner = this.game.ownerOf(space.id);
      if (owner) {
        const ownerTag = document.createElement('div');
        ownerTag.className = 'owner-tag';
        ownerTag.textContent = owner.name;
        ownerTag.style.color = TOKEN_COLORS[owner.id];
        div.appendChild(ownerTag);
      }
      if (space.price) {
        const price = document.createElement('div');
        price.className = 'space-price';
        price.textContent = `$${space.price}`;
        div.appendChild(price);
      }

      const tokens = document.createElement('div');
      tokens.className = 'tokens';
      players.forEach((p) => {
        if (!p.bankrupt && p.position === space.id) {
          const t = document.createElement('span');
          t.className = 'token';
          t.style.color = TOKEN_COLORS[p.id];
          t.textContent = TOKEN_EMOJI[p.id];
          tokens.appendChild(t);
        }
      });
      div.appendChild(tokens);

      this.boardEl.appendChild(div);
    });
  }

  renderPlayers() {
    this.playersEl.innerHTML = '';
    this.game.players.forEach((p) => {
      const card = document.createElement('div');
      card.className = 'player-card' + (p.bankrupt ? ' bankrupt' : '') + (p.id === this.game.currentPlayerIndex ? ' active' : '');
      card.style.borderColor = TOKEN_COLORS[p.id];
      const props = p.properties.map((id) => BOARD[id].name).join(', ') || '—';
      card.innerHTML = `
        <div class="player-name" style="color:${TOKEN_COLORS[p.id]}">${TOKEN_EMOJI[p.id]} ${p.name}${p.isBot ? ' (bot)' : ''}</div>
        <div class="player-money">💰 ${p.money}</div>
        <div class="player-props">${props}</div>
        ${p.inJail ? '<div class="player-jail">🔒 En el Caparazón</div>' : ''}
        ${p.bankrupt ? '<div class="player-jail">💀 Eliminado</div>' : ''}
      `;
      this.playersEl.appendChild(card);
    });
  }

  renderLog() {
    this.logEl.innerHTML = this.game.logLines
      .slice(-40)
      .reverse()
      .map((line) => `<li>${line}</li>`)
      .join('');
  }

  highlightCurrent() {
    this.renderPlayers();
  }

  clearControls() {
    this.controlsEl.innerHTML = '';
  }

  waitForRollButton(player, isJailRetry) {
    return new Promise((resolve) => {
      this.clearControls();
      const btn = document.createElement('button');
      btn.className = 'btn btn-primary';
      btn.textContent = isJailRetry ? `${player.name}: intentar salir` : `${player.name}: tirar dados`;
      btn.onclick = () => {
        this.clearControls();
        resolve();
      };
      this.controlsEl.appendChild(btn);
    });
  }

  askBuyDecision(player, space) {
    return new Promise((resolve) => {
      this.clearControls();
      const box = document.createElement('div');
      box.className = 'decision-box';
      box.innerHTML = `<p><strong>${space.name}</strong> está libre por $${space.price}.</p>`;
      const buyBtn = document.createElement('button');
      buyBtn.className = 'btn btn-primary';
      buyBtn.textContent = `Comprar ($${space.price})`;
      buyBtn.onclick = () => { this.clearControls(); resolve(true); };
      const skipBtn = document.createElement('button');
      skipBtn.className = 'btn btn-secondary';
      skipBtn.textContent = 'Pasar';
      skipBtn.onclick = () => { this.clearControls(); resolve(false); };
      box.appendChild(buyBtn);
      box.appendChild(skipBtn);
      this.controlsEl.appendChild(box);
    });
  }

  askJailDecision(player) {
    return new Promise((resolve) => {
      this.clearControls();
      const box = document.createElement('div');
      box.className = 'decision-box';
      box.innerHTML = `<p>${player.name}, estás en el Caparazón.</p>`;
      if (player.money >= 50) {
        const payBtn = document.createElement('button');
        payBtn.className = 'btn btn-primary';
        payBtn.textContent = 'Pagar 50 y salir';
        payBtn.onclick = () => { this.clearControls(); resolve('pay'); };
        box.appendChild(payBtn);
      }
      if (player.getOutOfJailFree > 0) {
        const cardBtn = document.createElement('button');
        cardBtn.className = 'btn btn-primary';
        cardBtn.textContent = `Usar tarjeta (${player.getOutOfJailFree})`;
        cardBtn.onclick = () => { this.clearControls(); resolve('card'); };
        box.appendChild(cardBtn);
      }
      const rollBtn = document.createElement('button');
      rollBtn.className = 'btn btn-secondary';
      rollBtn.textContent = 'Tirar dados (buscar dobles)';
      rollBtn.onclick = () => { this.clearControls(); resolve('roll'); };
      box.appendChild(rollBtn);
      this.controlsEl.appendChild(box);
    });
  }

  showGameOver(winner) {
    this.clearControls();
    const box = document.createElement('div');
    box.className = 'decision-box';
    box.innerHTML = `<h2>${winner ? `🏆 ¡${winner.name} gana!` : 'Fin de la partida'}</h2>`;
    const again = document.createElement('button');
    again.className = 'btn btn-primary';
    again.textContent = 'Jugar de nuevo';
    again.onclick = () => window.location.reload();
    box.appendChild(again);
    this.controlsEl.appendChild(box);
  }
}
