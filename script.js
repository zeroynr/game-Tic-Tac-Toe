class QLearningTicTacToe {
  constructor() {
    this.qTable = new Map(); // State-Action value table
    this.learningRate = 0.1;
    this.discountFactor = 0.9;
    this.epsilon = 1.0; // Exploration rate
    this.epsilonDecay = 0.995;
    this.minEpsilon = 0.1;
    this.experience = 0;

    // Game state
    this.board = Array(9).fill("");
    this.currentPlayer = "X"; // X = Player, O = AI
    this.gameOver = false;
    this.winner = null;

    // Statistics
    this.stats = {
      playerWins: 0,
      aiWins: 0,
      draws: 0,
      totalGames: 0,
    };

    this.initializeEventListeners();
    this.updateDisplay();
  }

  initializeEventListeners() {
    const cells = document.querySelectorAll(".cell");
    cells.forEach((cell) => {
      cell.addEventListener("click", (e) => {
        const index = parseInt(e.target.dataset.index);
        this.makeMove(index);
      });
    });
  }

  // Convert board state to string key for Q-table
  getBoardState() {
    return this.board.join("");
  }

  // Get available moves
  getAvailableMoves() {
    return this.board
      .map((cell, index) => (cell === "" ? index : -1))
      .filter((index) => index !== -1);
  }

  // Get Q-value for a state-action pair
  getQValue(state, action) {
    const key = `${state}_${action}`;
    return this.qTable.get(key) || 0;
  }

  // Set Q-value for a state-action pair
  setQValue(state, action, value) {
    const key = `${state}_${action}`;
    this.qTable.set(key, value);
  }

  // Choose action using epsilon-greedy strategy
  chooseAction(availableMoves) {
    if (Math.random() < this.epsilon) {
      // Exploration: random move
      return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    } else {
      // Exploitation: best known move
      const state = this.getBoardState();
      let bestAction = availableMoves[0];
      let bestValue = this.getQValue(state, bestAction);

      for (let action of availableMoves) {
        const value = this.getQValue(state, action);
        if (value > bestValue) {
          bestValue = value;
          bestAction = action;
        }
      }
      return bestAction;
    }
  }

  // Update Q-value using Q-learning formula
  updateQValue(state, action, reward, nextState) {
    const currentQ = this.getQValue(state, action);
    const nextMoves = this.getAvailableMoves();

    let maxNextQ = 0;
    if (nextMoves.length > 0 && !this.gameOver) {
      maxNextQ = Math.max(
        ...nextMoves.map((move) => this.getQValue(nextState, move))
      );
    }

    const newQ =
      currentQ +
      this.learningRate * (reward + this.discountFactor * maxNextQ - currentQ);
    this.setQValue(state, action, newQ);
  }

  // Check for winner
  checkWinner() {
    const winPatterns = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8], // Rows
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8], // Columns
      [0, 4, 8],
      [2, 4, 6], // Diagonals
    ];

    for (let pattern of winPatterns) {
      const [a, b, c] = pattern;
      if (
        this.board[a] &&
        this.board[a] === this.board[b] &&
        this.board[a] === this.board[c]
      ) {
        return this.board[a];
      }
    }

    return this.board.includes("") ? null : "draw";
  }

  // Calculate reward based on game outcome
  getReward(winner) {
    if (winner === "O") return 1; // AI wins
    if (winner === "X") return -1; // Player wins
    return 0; // Draw or game continues
  }

  // Make a move
  makeMove(index) {
    if (this.board[index] !== "" || this.gameOver) return false;

    const previousState = this.getBoardState();
    this.board[index] = this.currentPlayer;

    const winner = this.checkWinner();
    if (winner) {
      this.gameOver = true;
      this.winner = winner;
      this.updateStats();

      // Learn from the final move if it's AI's move
      if (this.currentPlayer === "O") {
        const reward = this.getReward(winner);
        this.updateQValue(previousState, index, reward, this.getBoardState());
        this.experience++;
      }
    } else {
      this.currentPlayer = this.currentPlayer === "X" ? "O" : "X";

      // If it's AI's turn and game is not over
      if (this.currentPlayer === "O" && !this.gameOver) {
        setTimeout(() => this.makeAIMove(), 500);
      }
    }

    this.updateDisplay();
    return true;
  }

  // AI makes a move
  makeAIMove() {
    if (this.gameOver) return;

    const availableMoves = this.getAvailableMoves();
    if (availableMoves.length === 0) return;

    const previousState = this.getBoardState();
    const action = this.chooseAction(availableMoves);

    this.board[action] = "O";

    const winner = this.checkWinner();
    if (winner) {
      this.gameOver = true;
      this.winner = winner;
      this.updateStats();
    }

    // Learn from this move
    const reward = this.getReward(winner);
    this.updateQValue(previousState, action, reward, this.getBoardState());
    this.experience++;

    // Decay epsilon (reduce exploration over time)
    this.epsilon = Math.max(this.minEpsilon, this.epsilon * this.epsilonDecay);

    this.currentPlayer = "X";
    this.updateDisplay();
  }

  // Update game statistics
  updateStats() {
    this.stats.totalGames++;
    if (this.winner === "X") this.stats.playerWins++;
    else if (this.winner === "O") this.stats.aiWins++;
    else if (this.winner === "draw") this.stats.draws++;
  }

  // Start a new game
  startNewGame() {
    this.board = Array(9).fill("");
    this.currentPlayer = "X";
    this.gameOver = false;
    this.winner = null;
    this.updateDisplay();
  }

  // Train AI by playing games against itself
  async trainAI() {
    const trainingGames = 100;
    const originalEpsilon = this.epsilon;

    document.getElementById(
      "status"
    ).textContent = `🧠 Melatih AI... (0/${trainingGames})`;

    for (let game = 0; game < trainingGames; game++) {
      // Reset board for training
      this.board = Array(9).fill("");
      this.gameOver = false;
      this.winner = null;
      this.currentPlayer = Math.random() < 0.5 ? "X" : "O"; // Random starting player

      // Play a complete game
      while (!this.gameOver) {
        const availableMoves = this.getAvailableMoves();
        if (availableMoves.length === 0) break;

        const previousState = this.getBoardState();
        const action = this.chooseAction(availableMoves);

        this.board[action] = this.currentPlayer;

        const winner = this.checkWinner();
        if (winner) {
          this.gameOver = true;
          this.winner = winner;
          this.updateStats();
        }

        // Learn from move
        const reward = this.getReward(winner);
        this.updateQValue(previousState, action, reward, this.getBoardState());
        this.experience++;

        this.currentPlayer = this.currentPlayer === "X" ? "O" : "X";
      }

      // Decay epsilon
      this.epsilon = Math.max(
        this.minEpsilon,
        this.epsilon * this.epsilonDecay
      );

      // Update progress periodically
      if (game % 10 === 0) {
        document.getElementById(
          "status"
        ).textContent = `🧠 Melatih AI... (${game}/${trainingGames})`;
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }

    this.startNewGame();
    this.updateDisplay();
  }

  // Reset AI learning
  resetAI() {
    this.qTable.clear();
    this.epsilon = 1.0;
    this.experience = 0;
    this.stats = {
      playerWins: 0,
      aiWins: 0,
      draws: 0,
      totalGames: 0,
    };
    this.startNewGame();
    this.updateDisplay();
  }

  // Update display
  updateDisplay() {
    // Update board
    const cells = document.querySelectorAll(".cell");
    cells.forEach((cell, index) => {
      cell.textContent = this.board[index];
      cell.className = "cell";
      if (this.board[index] === "X") cell.classList.add("x");
      if (this.board[index] === "O") cell.classList.add("o");
    });

    // Update status
    const status = document.getElementById("status");
    if (this.gameOver) {
      if (this.winner === "X") {
        status.textContent = "🎉 Anda Menang!";
        status.style.background = "rgba(255, 107, 107, 0.3)";
      } else if (this.winner === "O") {
        status.textContent = "🤖 AI Menang!";
        status.style.background = "rgba(78, 205, 196, 0.3)";
      } else {
        status.textContent = "🤝 Seri!";
        status.style.background = "rgba(255, 255, 255, 0.2)";
      }
    } else {
      if (this.currentPlayer === "X") {
        status.textContent = "🎮 Giliran Anda";
        status.style.background = "rgba(255, 107, 107, 0.2)";
      } else {
        status.textContent = "🤖 AI Sedang Berpikir...";
        status.style.background = "rgba(78, 205, 196, 0.2)";
        status.classList.add("thinking");
        setTimeout(() => status.classList.remove("thinking"), 1000);
      }
    }

    // Update statistics
    document.getElementById("playerWins").textContent = this.stats.playerWins;
    document.getElementById("aiWins").textContent = this.stats.aiWins;
    document.getElementById("draws").textContent = this.stats.draws;
    document.getElementById("totalGames").textContent = this.stats.totalGames;

    // Update learning progress
    document.getElementById("experience").textContent = this.experience;
    document.getElementById("epsilon").textContent =
      Math.round(this.epsilon * 100) + "%";

    const progress = Math.min(100, (this.experience / 1000) * 100);
    document.getElementById("progressFill").style.width = progress + "%";
  }
}

// Initialize game
const game = new QLearningTicTacToe();

// Global functions for buttons
function startNewGame() {
  game.startNewGame();
}

function trainAI() {
  game.trainAI();
}

function resetAI() {
  game.resetAI();
}
