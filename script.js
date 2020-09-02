const ticTacToe = (function(){
    const game = function(player1, player2){
        let gameStatus = GameStatus.NOT_STARTED;
        const positionMatrix = [[], [], []];
        const players = [player1, player2];
        const playersBoardPoints = [boardPoints(), boardPoints()];
        let currentPlayerId = 0; 

        const hasMultipleHumanPlayers = function(){
            return player1.isHuman && player2.isHuman;
        }

        const getCurrentPlayer = function(){
            return players[currentPlayerId];
        }

        const allMovesTaken = function(){
            return (playersBoardPoints[0].getTotal() + playersBoardPoints[1].getTotal()) >= 9;
        }

        const boardIsEmpty = function(){
            return (playersBoardPoints[0].getTotal() + playersBoardPoints[1].getTotal()) == 0;
        }

        const playerWon = function(playerId){
            const boardPoints = playersBoardPoints[playerId];

            return (boardPoints.hasFullColumn() || 
                boardPoints.hasFullRow() || 
                boardPoints.hasFullDiagonal());
        }

        const iterateToNextPlayer = function(){
            const nextPlayerId = (currentPlayerId == 0 ? 1 : 0);
            setCurrentPlayer(nextPlayerId);
        }

        const setCurrentPlayer = function(playerId){
            currentPlayerId = playerId;
        }

        const nextBestPosition = function(){
            const minimax = function(alpha, beta, depth, originalPlayerId, currentPlayerIsMaximizing){
                let finalScore;

                if(gameOver() || depth == 0){

                    finalScore = 0;

                    if(GameStatus.WON == getGameStatus()) {
                        finalScore = playerWon(originalPlayerId) ? 1 : -1;
                    }

                    return {
                        chosenPosition: null,
                        score: finalScore
                    }
                }

                let chosenPosition;
                let updateValues;

                if(currentPlayerIsMaximizing){
                    finalScore = -Infinity;
                    updateValues = (newScore, rowIndex, columnIndex) => {
                        if(newScore > finalScore){
                            finalScore = newScore;
                            chosenPosition = {rowIndex, columnIndex}; 
                        }
                        alpha = Math.max(alpha, newScore);
                    }
                } else {
                    finalScore = +Infinity;
                    updateValues = (newScore, rowIndex, columnIndex) => {
                        score = Math.min(finalScore, newScore);
                        if(newScore < finalScore){
                            finalScore = newScore;
                            chosenPosition = {rowIndex, columnIndex}; 
                        }
                        alpha = Math.min(alpha, newScore);
                    }
                }

                const nextPlayerIsMaximizing = !currentPlayerIsMaximizing;
                const myPlayerId = currentPlayerId;

                for(let i = 0; i < 3; i++){
                    for(let j = 0; j < 3; j++){
                        if(positionTaken(i, j)){
                            continue;
                        }

                        setCurrentPlayer(myPlayerId);
                        addPosition(i, j, false);
                        iterateToNextPlayer();

                        const result = minimax(alpha, beta, depth - 1, originalPlayerId, nextPlayerIsMaximizing);
                        updateValues(result.score, i, j);
                        
                        removePosition(i, j);

                        if(beta <= alpha){
                            break;
                        }
                    }
                }

                return {
                    chosenPosition, 
                    score: finalScore
                }
            }

            const originalPlayerId = currentPlayerId;
            const result = minimax(-Infinity, Infinity, 9, originalPlayerId, true);
            
            currentPlayerId = originalPlayerId;

            return result.chosenPosition;
        }

        const positionTaken = function(rowIndex, columnIndex){
            return (columnIndex in positionMatrix[rowIndex])
                && positionMatrix[rowIndex][columnIndex] != undefined 
                && positionMatrix[rowIndex][columnIndex] != null;
        }

        const addPosition = function(rowIndex, columnIndex, iterateToNextPlayerAfterMove){
            if(iterateToNextPlayerAfterMove == undefined){
                iterateToNextPlayerAfterMove = true;
            }

            if(positionTaken(rowIndex, columnIndex)){
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

            const currentPlayerWon = playerWon(currentPlayerId);
            if(allMovesTaken() || currentPlayerWon) {
                gameStatus = (currentPlayerWon ? GameStatus.WON : GameStatus.TIED);
            } else {
                if(iterateToNextPlayerAfterMove){
                    iterateToNextPlayer();
                }
            }
            
            return true;
        }

        const removePosition = function(rowIndex, columnIndex){
            if(!positionTaken(rowIndex, columnIndex)){
                return false;
            }

            const playerId = positionMatrix[rowIndex][columnIndex];
            positionMatrix[rowIndex][columnIndex] = null;

            playersBoardPoints[playerId].removePoint(rowIndex, columnIndex);
            gameStatus = (boardIsEmpty() ? GameStatus.NOT_STARTED : GameStatus.IN_PROGRESS);
            return true;
        }

        const scrubPosition = function(rowIndex, columnIndex){
            positionMatrix[rowIndex][columnIndex] = null;
        }

        const scrubPositions = function(positions){
            positions.forEach(position => {
                scrubPosition(position.rowIndex, position.columnIndex)
            });
        }

        const getGameStatus = function(){
            return gameStatus;        
        }

        const gameOver = function(){
            return (gameStatus == GameStatus.WON || gameStatus == GameStatus.TIED);
        }

        return {
            hasMultipleHumanPlayers,
            getCurrentPlayer,
            nextBestPosition,
            addPosition,
            getGameStatus, 
            gameOver,
            playerWon
        };
    }

    const boardPoints = function(boardPointsObj){
        let totalPoints = 0;
        let rowsPoints = [0, 0, 0];
        let columnsPoints = [0, 0, 0];
        let diagonalPoints = {
            upward: 0,
            downward: 0
        }

        if(boardPointsObj){
            totalPoints = boardPointsObj.getTotal();
            rowsPoints = boardPointsObj.getRowPoints();
            columnsPoints = boardPointsObj.getColumnsPoints();
            diagonalPoints = boardPointsObj.getDiagonalPoints();
        }

        const DiagonalDirection = {
            NONE: 'none',
            UPWARD: 'upward',
            DOWNWARD: 'downward',
            BI_DIRECTIONAL: 'bi-directional'
        }

        const getDiagonalDirectionFromIndex = function(rowIndex, columnIndex){
            const topLeftCorner = (rowIndex == 0 && columnIndex == 0);
            const bottomRightCorner = (rowIndex == 2 && columnIndex == 2);
            const topRightCorner = (rowIndex == 0 && columnIndex == 2);
            const bottomLeftCorner = (rowIndex == 2 && columnIndex == 0);
            const center = (rowIndex == 1 && columnIndex == 1);
            
            if(topLeftCorner || bottomRightCorner){
                return DiagonalDirection.DOWNWARD;
            }

            if(topRightCorner || bottomLeftCorner){
                return DiagonalDirection.UPWARD;
            }

            if(center){
                return DiagonalDirection.BI_DIRECTIONAL;
            }

            return DiagonalDirection.NONE;
        }

        const addPoint = function(rowIndex, columnIndex){
            totalPoints++;
            rowsPoints[rowIndex]++;
            columnsPoints[columnIndex]++;

            const direction = getDiagonalDirectionFromIndex(rowIndex, columnIndex);
            
            if(direction == DiagonalDirection.DOWNWARD){
                diagonalPoints.downward++;
            }

            if(direction == DiagonalDirection.UPWARD){
                diagonalPoints.upward++;
            }

            if(direction == DiagonalDirection.BI_DIRECTIONAL){
                diagonalPoints.upward++;
                diagonalPoints.downward++;
            }
        }

        const removePoint = function(rowIndex, columnIndex){
            totalPoints--;
            rowsPoints[rowIndex]--;
            columnsPoints[columnIndex]--;

            const direction = getDiagonalDirectionFromIndex(rowIndex, columnIndex);
            
            if(direction == DiagonalDirection.DOWNWARD){
                diagonalPoints.downward--;
            }

            if(direction == DiagonalDirection.UPWARD){
                diagonalPoints.upward--;
            }

            if(direction == DiagonalDirection.BI_DIRECTIONAL){
                diagonalPoints.upward--;
                diagonalPoints.downward--;
            }
        }

        const hasFullRow = function(){
            for(let i = 0; i < 3; i++){
                if(rowsPoints[i] >= 3){
                    return true;
                }
            }
            
            return false;
        }

        const hasFullColumn = function(){
            for(let i = 0; i < 3; i++){
                if(columnsPoints[i] >= 3){
                    return true;
                }
            }
            
            return false;
        }

        const hasFullDiagonal = function(){
            return (diagonalPoints.downward >= 3 || diagonalPoints.upward >= 3);
        }

        const getTotal = function(){
            return totalPoints;
        }

        return {
            addPoint,
            removePoint,
            hasFullRow,
            hasFullColumn,
            hasFullDiagonal,
            getTotal
        }
    }

    const GameStatus = {
        WON: 'game won',
        TIED: 'game tied',
        IN_PROGRESS: 'in progress',
        NOT_STARTED: 'not started'
    }

    const player = function(isHuman, name, symbol){
        return {
            isHuman, 
            name, 
            symbol
        };
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
                    showStatus();
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

                const hideStatus = function(){
                    gameStatusElement.style.display = 'none';
                }

                const showStatus = function(){
                    gameStatusElement.style.display = '';
                }

                const addPositionToBoard = function(blockElement, blockId, symbol){
                    if(!blockElement){
                        blockElement = gameBoardElement.querySelector(`[data-block-id="${blockId}"]`);
                    }
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
                    hideStatus,
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

                const playAISelectedRadio = formElement.querySelector('[name="play-ai"]:checked');
                
                let playAI = false;
                if(playAISelectedRadio){
                    playAI = (playAISelectedRadio.value == 'true');
                }

                const player1 = formElement.querySelector('[name="player1"]').value;
                const player2 = formElement.querySelector('[name="player2"]').value;
                startNewGame(playAI, player1, player2, uiHelper);
            });

            gameBoardElement.addEventListener("click", function(event){
                addPositionToBlock(event.target, null, uiHelper);
            });
        }

        const addPositionToBlock = function(blockElement, position, uiHelper){
            if(currentGame.gameOver()){
                return false;
            }

            let blockId;
            if(blockElement){
                blockId = blockElement.dataset.blockId;
            }

            const getPositionFromBlockId = function(blockId){
                const rowIndex = Math.floor(blockId/3);
                const columnIndex = blockId - (3*rowIndex);

                return {rowIndex, columnIndex};
            }

            const getBlockIdFromPosition = function(position){
                return position.columnIndex + (position.rowIndex * 3);
            }
            
            if(!position){
                position = getPositionFromBlockId(blockId);
            }
            
            const currentPlayer = currentGame.getCurrentPlayer();

            if(!currentGame.addPosition(position.rowIndex, position.columnIndex)){
                uiHelper.showPositionTakenMessage(currentPlayer.name);
                return false;
            }

            blockId = blockId ? blockId : getBlockIdFromPosition(position);
            uiHelper.addPositionToBoard(blockElement, blockId, currentPlayer.symbol);

            switch(currentGame.getGameStatus()) {
                case GameStatus.WON: 
                    uiHelper.showWinningMessage(currentPlayer.name);
                    break;
                case GameStatus.TIED: 
                    uiHelper.showTiedMessage();
                    break;
                default: 
                    const nextPlayer = currentGame.getCurrentPlayer();

                    if(currentGame.hasMultipleHumanPlayers()){
                        uiHelper.showPlayerTurnMessage(nextPlayer.name);
                        break;
                    }

                    if(!nextPlayer.isHuman){
                        const bestPosition = currentGame.nextBestPosition();
                        addPositionToBlock(null, bestPosition, uiHelper);
                    }
                break;
            }

            return true;
        }

        const startNewGame = function(playWithAI, player1, player2, uiHelper){
            player1 = player(true, player1, "X");
            player2 = player(true, player2, "O");

            if(playWithAI){
                player2 = player(false, "Computer", "O");
            }

            currentGame = game(player1, player2);
            uiHelper.clearBoard();

            if(currentGame.hasMultipleHumanPlayers()){
                uiHelper.showPlayerTurnMessage(player1.name);
            } else {
                uiHelper.hideStatus();
            }
        }

        return {init};
    }

    return {uiController};
})();

window.onload = ticTacToe
    .uiController('ttt-form-container', 'ttt-board-container')
    .init;