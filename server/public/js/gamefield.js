/* global ships */

class Gamefield{
	constructor(id){
		this._board = this.initializeBoard(); 
		this._id = id;   
		this._shipCoordinatesForServer = [];
	}

	//constants
	FIELDSIZE(){
		return 10;
	}
	EMPTYFIELD(){
		return 0;
	}
	SHIPFIELD(){
		return 1;
	}

	//Getter
	get board(){
		return this._board;
	}
	get shipCoordinatesForServer(){
		return this._shipCoordinatesForServer;
	}
	get id(){
		return this._id;
	}

	initializeBoard(){
		let emptyBoard = [];

		for(let row = 0; row < this.FIELDSIZE(); row++){
			//Initial board as 2dim Array    
			emptyBoard[row] = [];

			for(let col = 0; col < this.FIELDSIZE(); col++){
				emptyBoard[row][col] = this.EMPTYFIELD();
			}
		}

		return emptyBoard;
	}

	setUpShipsRandomly(){
		let shipProperties = ships.availableShips;
		let shipsToSetUp = this.getAllShips(shipProperties);
		let shipCoordinatesForServerIndex = 0;
		this._shipCoordinatesForServer = [];
        
		while(shipsToSetUp.length > 0){
			this._board = this.initializeBoard();
			let freeFields = this.getAvailableFields();
			shipsToSetUp = this.getAllShips(shipProperties);
    
			for(let currentShipProperty = 0; currentShipProperty < shipProperties.length; currentShipProperty++){
				for(let shipNumber = 0; shipNumber < ships.getShip(currentShipProperty).amount; shipNumber++){	
					let tmpFreeFields = freeFields.slice();		
					let actualShipNotSetInGameField = true;
					this._shipCoordinatesForServer[shipCoordinatesForServerIndex] = [];
    
					while(tmpFreeFields.length > 0 && actualShipNotSetInGameField){
						let position = this.getRowAndColFromString(tmpFreeFields[getRandomInt(0, tmpFreeFields.length - 1)]);
						let row = position[0];
						let col = position[1];
						let shipGamefieldDirections = this.shipLiesInGamefield(row, col, ships.getShip(currentShipProperty).gameFields);
						let randDirection;
                        
						let possibleDirection = false;
						while(!possibleDirection && shipGamefieldDirections.length > 0){
							randDirection = shipGamefieldDirections[getRandomInt(0, shipGamefieldDirections.length - 1)];
    
							//First field is always free
							for(let shipFields = 1, fieldPossible = true; shipFields < ships.getShip(currentShipProperty).gameFields && fieldPossible; shipFields++){
								let usedRow = row;
								let usedCol = col;
    
								switch(randDirection){
								case 1: usedRow -= shipFields; break;
								case 2: usedCol += shipFields; break;
								case 3: usedRow += shipFields; break;
								case 4: usedCol -= shipFields; break;
								default: 
									if(debug){
										alert("main.js -> setUpShipsRandomly() -> fehlerhafte Himmelsrichtung: " + randDirection);
									}			
								}
    
								let isFree = false;
								for(let freeFieldIndex = 0; freeFieldIndex < tmpFreeFields.length; freeFieldIndex++){
									if((usedRow + "-" + usedCol) === tmpFreeFields[freeFieldIndex]){
										isFree = true;
									}
								}
    
								if(!isFree){
									fieldPossible = false;
									possibleDirection = false;
									let indexPositionToShift = shipGamefieldDirections.indexOf(randDirection);
									shipGamefieldDirections.splice(indexPositionToShift, 1);
								}
								else{
									possibleDirection = true;
								}
							}
						}
                        
						//Set ship in gamefield
						if(possibleDirection){
							//Wenn die Information über den Schiffsnamen gebraucht wird. row und col liegen dann auf Index 1 und 2
							//shipCoordinatesForServer.ships[shipCoordinatesForServerIndex][0][0] = ship[shipProperties[actualShipProperty]].name;
							this._shipCoordinatesForServer[shipCoordinatesForServerIndex][0] = [];
							this._shipCoordinatesForServer[shipCoordinatesForServerIndex][0][0] = row;
							this._shipCoordinatesForServer[shipCoordinatesForServerIndex][0][1] = col;
                            
							//Set ship core
							this._board[row][col] = this.SHIPFIELD();
    
							for(let shipFields = 1; shipFields < ships.getShip(currentShipProperty).gameFields; shipFields++){
								this._shipCoordinatesForServer[shipCoordinatesForServerIndex][shipFields] = [];
								let usedRow = row;
								let usedCol = col;
    
								switch(randDirection){
								case 1: usedRow -= shipFields; break;
								case 2: usedCol += shipFields; break;
								case 3: usedRow += shipFields; break;
								case 4: usedCol -= shipFields; break;
								default: 
									if(debug){
										alert("main.js -> setUpShipsRandomly -> fehlerhafte Himmelsrichtung: " + randDirection);
									}	 		
								}				
								this._shipCoordinatesForServer[shipCoordinatesForServerIndex][shipFields][0] = usedRow;
								this._shipCoordinatesForServer[shipCoordinatesForServerIndex][shipFields][1] = usedCol;
								this._board[usedRow][usedCol] = this.SHIPFIELD();
							}
							shipCoordinatesForServerIndex++;
							freeFields = this.getAvailableFields();
							actualShipNotSetInGameField = false;
							let indexPositionToShift = shipsToSetUp.indexOf(ships.getShip(currentShipProperty).name);
							shipsToSetUp.shift(indexPositionToShift);
						}
						else{
							let indexPositionToShift = tmpFreeFields.indexOf(row + "-" + col);
							tmpFreeFields.splice(indexPositionToShift, 1);
						}
					}
				}	
			}
		}
	}

	getAllShips(shipProperties){
		let allShips = [];
    
		for(let i = 0; i < shipProperties.length; i++) {
			for(let amount = 0; amount < shipProperties[i].amount; amount++) {
				allShips.push(i);
			}
		}
    
		return allShips;
	}

	getAvailableFields(){
		var availableFields = [];
        
		for(let row = 0; row < this.FIELDSIZE(); row++){
			for(let col = 0; col < this.FIELDSIZE(); col++){
				let isAvailable = true;
    
				if(this._board[row][col] === this.EMPTYFIELD()){
					//Check north
					if(row - 1 >= 0){
						if(!(this._board[row - 1][col] === this.EMPTYFIELD())){
							isAvailable = false;
						}
						if(col - 1 >= 0){
							if(!(this._board[row - 1][col - 1] === this.EMPTYFIELD())){
								isAvailable = false;
							}
						}
						if(col + 1 < this.FIELDSIZE()){
							if(!(this._board[row - 1][col + 1] === this.EMPTYFIELD())){
								isAvailable = false;
							}
						}
					}
					//Check east
					if(col + 1 < this.FIELDSIZE()){
						if(!(this._board[row][col + 1] === this.EMPTYFIELD())){
							isAvailable = false;
						}
						if(row + 1 < this.FIELDSIZE()){
							if(!(this._board[row + 1][col + 1] === this.EMPTYFIELD())){
								isAvailable = false;
							}
						}
					}
					//Check south
					if(row + 1 < this.FIELDSIZE()){
						if(!(this._board[row + 1][col] === this.EMPTYFIELD())){
							isAvailable = false;
						}
						if(col - 1 >= 0){
							if(!(this._board[row + 1][col - 1] === this.EMPTYFIELD())){
								isAvailable = false;
							}
						}
					}
					//Check west
					if(col - 1 >= 0){
						if(!(this._board[row][col - 1] === this.EMPTYFIELD())){
							isAvailable = false;
						}
					}
				}
				else{
					isAvailable = false;
				}
    
				if(isAvailable){
					availableFields.push(row + "-" + col);
				}
			}
		}
    
		return availableFields;
	}

	shipLiesInGamefield(row, col, shipUsedGamefields){
		var possibleDirection = [];
    
		//Check north
		if(row - shipUsedGamefields >= 0){
			possibleDirection.push(1);
		}
		//Check east
		if(col + shipUsedGamefields <= this.FIELDSIZE()){
			possibleDirection.push(2);
		}
		//Check south
		if(row + shipUsedGamefields <= this.FIELDSIZE()){
			possibleDirection.push(3);
		}
		//Check west
		if(col - shipUsedGamefields >= 0){
			possibleDirection.push(4);
		}
    
		return possibleDirection;
	}

	/**
    * returns array with: array[0] = [int] row and array[1] = [int] col; from string with: var string = 'row-col';
    * @param {*} string with format: 'row-col';
    */
	getRowAndColFromString(string){
		let parts = string.split("-");

		return [parseInt(parts[0]), parseInt(parts[1])];
	}

}