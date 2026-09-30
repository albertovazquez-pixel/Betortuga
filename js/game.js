// Betortuga — motor del juego (vanilla JS, sin dependencias)

const TOKEN_COLORS = ['#2e7d32', '#c62828', '#1565c0', '#f9a825'];
const TOKEN_EMOJI = ['🐢', '🐸', '🦀', '🐬'];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class Player {
  constructor(id, name, isBot) {
    this.id = id;
    this.name = name;
    this.isBot = isBot;
    this.position = 0;
    this.money = STARTING_MONEY;
    this.properties = [];
    this.inJail = false;
    this.jailTurns = 0;
    this.getOutOfJailFree = 0;
    this.bankrupt = false;
  }
}

class Game {
  constructor(playerNames) {
    this.players = playerNames.map((name, i) => new Player(i, name, i !== 0));
    this.currentPlayerIndex = 0;
    this.logLines = [];
    this.gameOver = false;
    this.pendingAction = null; // { type, resolve }
    this.ui = new UI(this);
  }

  log(text) {
    this.logLines.push(text);
    if (this.logLines.length > 200) this.logLines.shift();
    this.ui.renderLog();
  }

  activePlayers() {
    return this.players.filter((p) => !p.bankrupt);
  }

  ownerOf(spaceId) {
    return this.players.find((p) => !p.bankrupt && p.properties.includes(spaceId)) || null;
  }

  rollDice() {
    return [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)];
  }

  transferFromBank(player, amount) {
    player.money += amount;
  }

  transferToBank(player, amount) {
    player.money -= amount;
  }

  transfer(from, to, amount) {
    from.money -= amount;
    to.money += amount;
  }

  collectFromAll(player, amount) {
    for (const other of this.activePlayers()) {
      if (other !== player) this.transfer(other, player, amount);
    }
  }

  sendToJail(player) {
    player.position = 10;
    player.inJail = true;
    player.jailTurns = 0;
    this.log(`${player.name} va directo al Caparazón (cárcel).`);
  }

  computeRent(space, owner, diceSum) {
    if (space.type === 'property') {
      const groupSpaces = BOARD.filter((s) => s.type === 'property' && s.group === space.group);
      const ownsFullGroup = groupSpaces.every((s) => owner.properties.includes(s.id));
      return ownsFullGroup ? space.rent[1] : space.rent[0];
    }
    if (space.type === 'station') {
      const owned = BOARD.filter((s) => s.type === 'station' && owner.properties.includes(s.id)).length;
      return [25, 50, 100, 200][owned - 1] || 25;
    }
    if (space.type === 'utility') {
      const owned = BOARD.filter((s) => s.type === 'utility' && owner.properties.includes(s.id)).length;
      return diceSum * (owned >= 2 ? 10 : 4);
    }
    return 0;
  }

  async moveForward(player, steps) {
    const old = player.position;
    player.position = (player.position + steps) % 40;
    if (player.position < old) {
      this.transferFromBank(player, 200);
      this.log(`${player.name} pasa por la Salida y cobra 200.`);
    }
    this.ui.renderBoard();
    this.ui.renderPlayers();
    await sleep(450);
  }

  async moveTo(player, targetId, awardGo = false) {
    player.position = targetId;
    if (awardGo) {
      this.transferFromBank(player, 200);
      this.log(`${player.name} cobra 200 de la Salida.`);
    }
    this.ui.renderBoard();
    this.ui.renderPlayers();
    await sleep(450);
    await this.resolveSpace(player, 0, true);
  }

  async moveBy(player, delta) {
    player.position = ((player.position + delta) % 40 + 40) % 40;
    this.ui.renderBoard();
    this.ui.renderPlayers();
    await sleep(450);
    await this.resolveSpace(player, 0, true);
  }

  async moveToNearest(player, type) {
    const spaceIds = BOARD.filter((s) => s.type === type).map((s) => s.id);
    const ahead = spaceIds.filter((id) => id > player.position);
    const target = ahead.length ? Math.min(...ahead) : Math.min(...spaceIds);
    const passesGo = target < player.position;
    await this.moveTo(player, target, passesGo);
  }

  async drawCard(player, deck, label) {
    const card = deck[Math.floor(Math.random() * deck.length)];
    this.log(`${player.name} saca "${label}": ${card.text}`);
    await card.effect(player, this);
    this.checkBankrupt(player);
    this.ui.renderPlayers();
  }

  async offerBuy(player, space) {
    if (player.money < space.price) {
      this.log(`${player.name} no tiene fondos para comprar ${space.name}.`);
      return;
    }
    let wantsToBuy;
    if (player.isBot) {
      const reserve = 120;
      wantsToBuy = player.money - space.price >= reserve;
      await sleep(500);
    } else {
      wantsToBuy = await this.ui.askBuyDecision(player, space);
    }
    if (wantsToBuy) {
      player.money -= space.price;
      player.properties.push(space.id);
      this.log(`${player.name} compra ${space.name} por ${space.price}.`);
    } else {
      this.log(`${player.name} decide no comprar ${space.name}.`);
    }
    this.ui.renderPlayers();
    this.ui.renderBoard();
  }

  async resolveSpace(player, diceSum, isNestedCardMove = false) {
    const space = BOARD[player.position];
    if (!isNestedCardMove) this.log(`${player.name} cae en ${space.name}.`);

    switch (space.type) {
      case 'property':
      case 'station':
      case 'utility': {
        const owner = this.ownerOf(space.id);
        if (!owner) {
          await this.offerBuy(player, space);
        } else if (owner !== player) {
          const rent = this.computeRent(space, owner, diceSum || (Math.floor(Math.random() * 6) + Math.floor(Math.random() * 6) + 2));
          this.transfer(player, owner, rent);
          this.log(`${player.name} paga ${rent} de renta a ${owner.name}.`);
        }
        break;
      }
      case 'tax':
        this.transferToBank(player, space.amount);
        this.log(`${player.name} paga ${space.amount} de impuestos.`);
        break;
      case 'chance':
        if (!isNestedCardMove) await this.drawCard(player, CHANCE_CARDS, 'Suerte');
        break;
      case 'chest':
        if (!isNestedCardMove) await this.drawCard(player, CHEST_CARDS, 'Caja Comunal');
        break;
      case 'gotojail':
        this.sendToJail(player);
        break;
      case 'go':
        this.transferFromBank(player, 200);
        this.log(`${player.name} cae en la Salida y cobra 200.`);
        break;
      default:
        break;
    }
    this.checkBankrupt(player);
    this.ui.renderPlayers();
  }

  checkBankrupt(player) {
    if (player.money < 0 && !player.bankrupt) {
      player.bankrupt = true;
      player.properties = [];
      this.log(`💀 ${player.name} se queda sin conchas y queda eliminado.`);
      this.ui.renderPlayers();
    }
    return player.bankrupt;
  }

  checkWin() {
    const active = this.activePlayers();
    if (active.length <= 1) {
      this.gameOver = true;
      const winner = active[0];
      this.log(winner ? `🏆 ¡${winner.name} gana la partida!` : 'La partida termina sin sobrevivientes.');
      this.ui.showGameOver(winner);
      return true;
    }
    return false;
  }

  async handleJail(player) {
    let action;
    if (player.isBot) {
      await sleep(500);
      if (player.getOutOfJailFree > 0) action = 'card';
      else if (player.money >= 250) action = 'pay';
      else action = 'roll';
    } else {
      action = await this.ui.askJailDecision(player);
    }

    if (action === 'card') {
      player.getOutOfJailFree -= 1;
      player.inJail = false;
      this.log(`${player.name} usa una tarjeta de "Sal Libre del Caparazón".`);
      return { status: 'escaped', dice: null };
    }
    if (action === 'pay') {
      player.money -= 50;
      player.inJail = false;
      this.log(`${player.name} paga 50 y sale del Caparazón.`);
      this.checkBankrupt(player);
      return { status: 'escaped', dice: null };
    }
    // roll for doubles
    const [d1, d2] = this.rollDice();
    this.log(`${player.name} tira ${d1} y ${d2} para intentar salir.`);
    if (d1 === d2) {
      player.inJail = false;
      this.log(`${player.name} saca dobles y sale del Caparazón.`);
      return { status: 'escaped', dice: [d1, d2] };
    }
    player.jailTurns += 1;
    if (player.jailTurns >= 3) {
      player.money -= 50;
      player.inJail = false;
      this.log(`${player.name} agota sus intentos, paga 50 y sale del Caparazón.`);
      this.checkBankrupt(player);
      return { status: 'escaped', dice: null };
    }
    this.log(`${player.name} sigue en el Caparazón.`);
    return { status: 'stay', dice: null };
  }

  async playTurn(player) {
    let doublesStreak = 0;
    let rollAgain = true;
    while (rollAgain && !this.gameOver) {
      rollAgain = false;
      let dice = null;

      if (player.inJail) {
        const result = await this.handleJail(player);
        if (result.status === 'stay') break;
        dice = result.dice;
      }

      if (!dice) {
        if (!player.isBot) await this.ui.waitForRollButton(player, false);
        dice = this.rollDice();
        const [d1, d2] = dice;
        this.log(`${player.name} tira ${d1} y ${d2}.`);
        if (d1 === d2) {
          doublesStreak += 1;
          if (doublesStreak === 3) {
            this.log(`${player.name} saca dobles 3 veces seguidas. ¡Directo al Caparazón!`);
            this.sendToJail(player);
            break;
          }
        }
        await this.moveForward(player, d1 + d2);
        await this.resolveSpace(player, d1 + d2);
      } else {
        await this.moveForward(player, dice[0] + dice[1]);
        await this.resolveSpace(player, dice[0] + dice[1]);
      }

      if (this.checkBankrupt(player)) break;
      if (this.checkWin()) break;

      if (dice[0] === dice[1] && !player.inJail) {
        this.log(`${player.name} sacó dobles, ¡tira otra vez!`);
        rollAgain = true;
      }
    }
  }

  nextPlayerIndex() {
    let idx = this.currentPlayerIndex;
    do {
      idx = (idx + 1) % this.players.length;
    } while (this.players[idx].bankrupt);
    return idx;
  }

  async run() {
    this.ui.renderBoard();
    this.ui.renderPlayers();
    this.ui.renderLog();
    while (!this.gameOver) {
      const player = this.players[this.currentPlayerIndex];
      if (player.bankrupt) {
        this.currentPlayerIndex = this.nextPlayerIndex();
        continue;
      }
      this.ui.highlightCurrent(player);
      try {
        await this.playTurn(player);
      } catch (err) {
        console.error(err);
        this.log(`⚠️ Ocurrió un problema en el turno de ${player.name}, se pasa el turno.`);
      }
      if (this.gameOver) break;
      this.currentPlayerIndex = this.nextPlayerIndex();
      await sleep(300);
    }
  }
}
