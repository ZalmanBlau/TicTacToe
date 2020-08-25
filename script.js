const ticTacToe = (function(){

    const game = function(player1, player2){
        let gameStatus = GameStatus.NOT_STARTED;
        const positionMatrix = [[], [], []];
        const players = [player1, player2];
        const playersBoardPoints = [];
        let currentPlayerId = 0; 

        const boardPoints = function(){
            let totalPoints = 0;
            let rowsPoints = [0, 0, 0];
            let columnsPoints = [0, 0, 0];
            let diagonalPoints = {
                upward: 0,
                downward: 0
            }

            const addPoint = function(rowIndex, columnIndex){
                totalPoints++;
                rowsPoints[rowIndex]++;
                columnsPoints[columnIndex]++;
                
                // for center position
                if(rowIndex == 1 && columnIndex == 1){
                    diagonalPoints.upward++;
                    diagonalPoints.downward++;
                }

                // for corner positions
                const topLeftCorner = (rowIndex == 0 && columnIndex == 0);
                const bottomRightCorner = (rowIndex == 2 && columnIndex == 2);
                const topRightCorner = (rowIndex == 0 && columnIndex == 2);
                const bottomLeftCorner = (rowIndex == 2 && columnIndex == 0);
                
                if(topLeftCorner || bottomRightCorner){
                    diagonalPoints.downward++;
                }

                if(topRightCorner || bottomLeftCorner){
                    diagonalPoints.upward++;
                }
            }

            const hasFullRow = function(rowIndex){
                return rowsPoints[rowIndex] >= 3;
            }

            const hasFullColumn = function(columnIndex){
                return columnsPoints[columnIndex] >= 3;
            }

            const hasFullDiagonal = function(){
                return (diagonalPoints.downward >= 3 || diagonalPoints.upward >= 3);
            }

            const getTotal = function(){
                return totalPoints;
            }

            return {
                addPoint,
                hasFullRow,
                hasFullColumn,
                hasFullDiagonal,
                getTotal
            }
        }

        playersBoardPoints[0] = boardPoints();
        playersBoardPoints[1] = boardPoints();

        const getCurrentPlayer = function(){
            return players[currentPlayerId];
        }

        const allMovesTaken = function(){
            return (playersBoardPoints[0].getTotal() + playersBoardPoints[1].getTotal()) >= 9;
        }

        const winnerExists = function(rowIndex, columnIndex){
            const boardPoints = playersBoardPoints[currentPlayerId];

            return (boardPoints.hasFullColumn(columnIndex) || 
                boardPoints.hasFullRow(rowIndex) || 
                boardPoints.hasFullDiagonal());

        }

        const nextTurn = function(){
            currentPlayerId = (currentPlayerId == 0 ? 1 : 0);
        }

        const addPosition = function(rowIndex, columnIndex){
            if(columnIndex in positionMatrix[rowIndex]){
                //invalid move, position already exists.
                return false;
            }

            if(gameOver()){
                // game is over, new positions are not allowed;
                return false;
            }

            gameStatus = GameStatus.IN_PROGRESS;
            positionMatrix[rowIndex][columnIndex] = currentPlayerId;
            playersBoardPoints[currentPlayerId].addPoint(rowIndex, columnIndex);

            const hasWinner = winnerExists(rowIndex, columnIndex);
            if(allMovesTaken() || hasWinner) {
                gameStatus = (hasWinner ? GameStatus.WON : GameStatus.TIED);
            } else {
                nextTurn();
            }
            
            return true;
        }

        const getGameStatus = function(){
            return gameStatus;
        }

        const gameOver = function(){
            return (gameStatus == GameStatus.WON || gameStatus == GameStatus.TIED);
        }

        return {
            getCurrentPlayer, 
            addPosition,
            getGameStatus, 
            gameOver
        };
    }

    const GameStatus = {
        WON: 'game won',
        TIED: 'game tied',
        IN_PROGRESS: 'in progress',
        NOT_STARTED: 'not started'
    }

    const player = function(human, name, symbol){
        return {human, name, symbol};
    }

    const uiController = function(formId, gameContainerId){
        let player1 = player(true, 'Player #1', "X");
        let player2 = player(true, 'Player #2', "O");
        let currentGame = game(player1, player2);
        
        const init = function(){
            const formElement = document.getElementById(formId);
            const gameContainerElement = document.getElementById(gameContainerId);
            const gameBoardElement = gameContainerElement.getElementsByClassName('game-board')[0];
            const gameStatusElement = gameContainerElement.getElementsByClassName('game-status')[0];
            
            const uiHelper = (function(){
                const htmlToElement = function(html){
                    const template = document.createElement('template');
                    html = html.trim();
                    template.innerHTML = html;
                    return template.content.firstChild;
                }

                const removeAllChildren = function(element){
                    for(let i = 0; element.children.length; i++){
                        const child = element.children[i];
                        element.removeChild(child);
                    }
                }

                const updateStatusMessage = function(html){
                    const messageElement = htmlToElement(html);
                    removeAllChildren(gameStatusElement);
                    gameStatusElement.appendChild(messageElement);
                }

                const showPositionTakenMessage = function(playerName){
                    updateStatusMessage(
                        `<span class="red"> 
                            That position is already taken. <br>
                            Please try again, ${playerName}.
                        </span>`
                    );
                }

                const showWinningMessage = function(playerName){
                    updateStatusMessage(
                        `<span>
                            Congratulations ${playerName}!! You Won!
                        </span>`
                    );
                }

                const showNewGameMessage = function(){
                    updateStatusMessage(
                        `<span>
                            Start New Game!
                        </span>`
                    );
                }

                const showTiedMessage = function(){
                    updateStatusMessage(
                        `<span>
                            Game Over: Tied!!
                        </span>`
                    );
                }

                const showPlayerTurnMessage = function(playerName){
                    updateStatusMessage(
                        `<span>
                            ${playerName}'s turn!
                        </span>`
                    );
                }

                const addPositionToBoard = function(blockElement, symbol){
                    blockElement.textContent = symbol;
                }

                const clearBoard = function(){
                    const boardBlockElements = gameBoardElement.getElementsByClassName('board-block');
                    for(let i = 0; i < 9; i++){
                        boardBlockElements[i].textContent = '';
                    }
                }

                return {
                    showPositionTakenMessage, 
                    showWinningMessage, 
                    showTiedMessage,
                    showPlayerTurnMessage,
                    showNewGameMessage,
                    addPositionToBoard,
                    clearBoard
                };

            })();

            uiHelper.showNewGameMessage();

            const aiRadios = formElement.querySelectorAll('[name="play-ai"]');
            for(let i = 0; i < 2; i++){
                const aiRadio = aiRadios[i];
                aiRadio.addEventListener("click", function(){
                    const playAI = (formElement.querySelector('[name="play-ai"]:checked').value == 'true');
                    const player2Control = formElement.querySelectorAll('.player-name-controls .form-control')[1];
                    
                    if(playAI){
                        player2Control.style.display = 'none';
                    } else {
                        player2Control.style.display = '';
                    }
                });
            }

            formElement.addEventListener("submit", function(event){
                event.preventDefault();

                const playAI = (formElement.querySelector('[name="play-ai"]:checked').value == 'true');
                const player1 = formElement.querySelector('[name="player1"]').value;
                const player2 = formElement.querySelector('[name="player2"]').value;
                startNewGame(playAI, player1, player2, uiHelper);
            });

            gameBoardElement.addEventListener("click", function(event){
                addPositionToBlock(event.target, uiHelper);
            });
        }

        const addPositionToBlock = function(blockElement, uiHelper){
            if(currentGame.gameOver()){
                return false;
            }
            
            const blockId = Number(blockElement.dataset.blockId);
            const rowIndex = Math.floor(blockId/3);
            const columnIndex = blockId - (3*rowIndex);
            const currentPlayer = currentGame.getCurrentPlayer();

            if(!currentGame.addPosition(rowIndex, columnIndex)){
                uiHelper.showPositionTakenMessage(currentPlayer.name);
                return false;
            }

            uiHelper.addPositionToBoard(blockElement, currentPlayer.symbol);

            switch(currentGame.getGameStatus()) {
                case GameStatus.WON: 
                    uiHelper.showWinningMessage(currentPlayer.name);
                    break;
                case GameStatus.TIED: 
                    uiHelper.showTiedMessage();
                    break;
                default: 
                    const nextPlayer = currentGame.getCurrentPlayer();
                    uiHelper.showPlayerTurnMessage(nextPlayer.name);
                break;
            }

            return true;
        }

        const startNewGame = function(playWithAI, player1, player2, uiHelper){
            player1 = player(true, player1, "X");
            if(playWithAI){
                player2 = player(false, "Computer", "O");
            } else {
                player2 = player(true, player2, "O");
            }

            currentGame = game(player1, player2);
            uiHelper.clearBoard();
            uiHelper.showPlayerTurnMessage(player1.name);
        }

        return {init};
    }

    return {uiController};
})();

window.onload = ticTacToe
    .uiController('ttt-form-container', 'ttt-board-container')
    .init;