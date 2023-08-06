import {Canvas, CanvasRenderingContext2D, createCanvas, Image, loadImage} from "canvas";
import {Message} from "discord.js"
import {hexToRgba} from "./extras";
import * as fs from "fs";

interface BoardGameOptions {
    name: string;
    color?: CanvasRenderingContext2D["fillStyle"];
    moveTo?: number; // move to index
}

interface BoardGameData {
    size: [number, number]; // [x,y]
    content: BoardGameOptions[];
    background?: CanvasRenderingContext2D["fillStyle"];
    memberCount?: number & { __lt: 4 };
}

export const userGame: Map<string, _2048> = new Map();

class _2048 {
    private colors: { [key: number | string]: string } = {
        '2': '#EEE4DA',
        '4': '#EDE0C8',
        '8': '#F2B179',
        '16': '#F59563',
        '32': '#F67C5F',
        '64': '#F65E3B',
        '128': '#EDCF72',
        '256': '#EDCC61',
        '512': '#EDC850',
        '1024': '#EDC53F',
        '2048': '#EDC22E'
    };
    private canvas: Canvas;
    private ctx: CanvasRenderingContext2D;
    private board: number[][];
    private flag = -1;
    public score = 0;
    public size = 4;
    public message?: Message;

    constructor() {
        this.canvas = createCanvas(400, 400);
        this.ctx = this.canvas.getContext("2d");
        this.board = Array.from({length: this.size}, () => new Array(this.size).fill(0));
    }

    private makeCanvas(num: number) {
        this.board = Array(num).fill(0).map(() => Array(num).fill(0));
        return createCanvas(num * 100, num * 100);
    }

    public start(size: number) {
        if (this.flag < 0) {
            const getCanvas = this.makeCanvas(size);
            this.flag = 0;
            this.canvas = getCanvas;
            this.ctx = getCanvas.getContext('2d');
            this.drawBoard();
            this.addTile();
            this.addTile();
            this.drawBoard();
            return {status: "start", score: this.score, image: this.saveImage()}
        } else {
            return {status: "already"}
        }
    }

    private drawBoard() {
        this.ctx.fillStyle = '#BBADA0';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                const value = this.board[row][col];
                const x = col * 100 + 50;
                const y = row * 100 + 50;
                this.ctx.fillStyle = this.colors[String(value)] || '#CFC2B6';
                this.ctx.fillRect(x - 45, y - 45, 90, 90);
                if (value) {
                    this.ctx.fillStyle = value > 4 ? '#FFFFFF' : '#776E65';
                    this.ctx.font = 'bold 40px sans-serif';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText(String(value), x, y + 15);
                }
            }
        }
    }

    private addTile() {
        const emptyTiles: { row: number, col: number }[] = [];
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.board[row][col] === 0) {
                    emptyTiles.push({row, col});
                }
            }
        }
        if (emptyTiles.length) {
            const {row, col} = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
            this.board[row][col] = Math.random() < 0.9 ? 2 : 4;
        }
    }

    public move(direction: string) {
        let moved = false;
        for (let i = 0; i < this.size; i++) {
            const tiles: number[] = [];
            for (let j = 0; j < this.size; j++) {
                const row = direction === 'up' ? j : direction === 'down' ? this.size - j - 1 : i;
                const col = direction === 'left' ? j : direction === 'right' ? this.size - j - 1 : i;
                tiles.push(this.board[row][col]);
            }
            const merged = this.mergeTiles(tiles);
            for (let j = 0; j < this.size; j++) {
                const row = direction === 'up' ? j : direction === 'down' ? this.size - j - 1 : i;
                const col = direction === 'left' ? j : direction === 'right' ? this.size - j - 1 : i;
                const value = merged[j];
                const current = this.board[row][col];
                if (value !== current) {
                    moved = true;
                }
                this.board[row][col] = value;
            }
        }
        if (moved) {
            this.addTile();
            this.drawBoard();
            this.flag = 0;
            return {status: "proceeding", score: this.score, image: this.saveImage()};
        } else if (this.isWin()) {
            this.drawWin();
            this.flag = 1;
            return {status: "win", score: this.score, image: this.saveImage()};
        } else if (this.isGameOver()) {
            this.drawGameOver();
            this.flag = 2;
            return {status: "lose", score: this.score, image: this.saveImage()};
        } else {
            return false
        }
    }

    private mergeTiles(tiles: number[]) {
        const merged: number[] = [];
        let i = 0;
        while (i < this.size) {
            if (tiles[i]) {
                const currentValue = tiles[i];
                let j = i + 1;
                while (j < this.size && !tiles[j]) {
                    j++;
                }
                if (j < this.size && tiles[j] === currentValue) {
                    merged.push(currentValue * 2);
                    this.score += currentValue
                    i = j + 1;
                } else {
                    merged.push(currentValue);
                    i = j;
                }
            } else {
                i++;
            }
        }
        while (merged.length < this.size) {
            merged.push(0);
        }

        return merged;
    }

    private isGameOver() {
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.board[row][col] === 0) {
                    return false;
                }
                if (col > 0 && this.board[row][col] === this.board[row][col - 1]) {
                    return false;
                }
                if (col < this.size - 1 && this.board[row][col] === this.board[row][col + 1]) {
                    return false;
                }
                if (row > 0 && this.board[row][col] === this.board[row - 1][col]) {
                    return false;
                }
                if (row < this.size - 1 && this.board[row][col] === this.board[row + 1][col]) {
                    return false;
                }
            }
        }
        return true;
    }

    private isWin() {
        for (let i = 0; i < this.board.length; i++) {
            if (this.board[i].includes(2048)) return true;
        }
        return false;
    }

    public drawGameOver() {
        this.ctx.fillStyle = hexToRgba('#776E65', 0.5);
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 60px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Game Over', this.canvas.width / 2, this.canvas.height / 2);
    }

    public drawWin() {
        this.ctx.fillStyle = hexToRgba('#776E65', 0.5);
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 60px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('You Win!', this.canvas.width / 2, this.canvas.height / 2);
    }

    public saveImage() {
        return this.canvas.toBuffer();
    }
}

class BoardGame {
    private canvas: Canvas;
    private ctx: CanvasRenderingContext2D;
    private place: number[][];
    private userPlace: number[][];
    private size: number;
    private data: BoardGameData;

    constructor(data: BoardGameData) {
        this.canvas = createCanvas(data.size[0], data.size[1]);
        this.ctx = this.canvas.getContext('2d');
        this.place = [];
        this.userPlace = [];
        this.size = ((data.content!!.length - 4) / 4) + 2
        this.data = data;
    }

    private createRandomColor() {
        const color = Math.floor(Math.random() * 16777215).toString(16);
        return `#${color}`;
    }

    private createCircle(x: number, y: number, radius: number, color: string) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2, true);
        this.ctx.fillStyle = color;
        this.ctx.fill();

    }

    private async setBackground(background: BoardGameData["background"]) {
        if (background) {
            if (typeof background === "string") {
                if (background.startsWith("http")) {
                    try {
                        const backImage = await loadImage(background)
                        this.ctx.drawImage(backImage, 0, 0, this.canvas.width, this.canvas.height);
                    } catch (e) {
                        throw new Error("링크가 잘못되었습니다")
                    }
                } else if (background.startsWith("#")) {
                    this.ctx.fillStyle = background;
                    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                }
            } else {
                this.ctx.fillStyle = background;
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            }
        } else {
            this.ctx.fillStyle = "#343d45";
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    public drawOptions(options: BoardGameOptions[]) {
        if (options.length % 4 !== 0) throw new Error("옵션의 길이가 4의 배수가 아닙니다");
        if (options.length < 8) throw new Error("옵션값이 너무 작습니다");

        this.place = []; // 위치 초기화
        const findN = (x: number) => ((x - 4) / 4) + 2;
        const count = findN(options.length); // nxn의 n
        let bigIndex = 0; // 1:up 2:right 3:down 4:left
        let placeX = 0;
        let placeY = 0;
        const [rectWidth, rectHeight] = [this.canvas.width / count, this.canvas.height / count];
        options.forEach((option, index) => {
            if (index + 1 === count ? true : index % (count - 1) === 0) bigIndex++;
            console.log(bigIndex)
            switch (bigIndex) {
                case 1:
                    placeX = rectWidth * index;
                    placeY = 0;
                    break;
                case 2:
                    placeX = rectWidth * (count - 1);
                    placeY = rectHeight * (index - (count - 1) * (bigIndex - 1));
                    break;
                case 3:
                    placeX = rectWidth * ((count - 1) * bigIndex - index);
                    placeY = rectHeight * (count - 1); // 왼쪽 아래
                    break;
                case 4:
                    placeX = 0;
                    placeY = rectHeight * ((count - 1) * bigIndex - index);
                    break;
            }
            this.place.push([placeX, placeY]);
            this.ctx.fillStyle = option.color ?? this.createRandomColor();
            this.ctx.fillRect(placeX, placeY, rectWidth, rectHeight);
            this.ctx.font = '15pt PT Sans';
            this.ctx.textAlign = "center";
            this.ctx.fillStyle = "#000000";
            this.ctx.fillText(option.name, placeX + rectWidth / 2, placeY + rectHeight / 2);
        })
    }

    private setUser(count: BoardGameData["memberCount"]) {
        if (this.place.length === 0) throw new Error("옵션을 먼저 설정해주세요");
        if (this.userPlace.length === 0) {
            const [rectWidth, rectHeight] = [this.canvas.width / this.size, this.canvas.height / this.size];
            const memberCount = count ?? 1;
            switch (memberCount) {
                case 1:
                    this.userPlace.push([this.place[0][0] + rectWidth/4, this.place[0][1] + rectHeight/4]);
                    break;
                case 2:
                    this.userPlace.push([this.place[0][0] + rectWidth/4, this.place[0][1] + rectHeight/4]);
                    this.userPlace.push([this.place[0][0] + (rectWidth/4)*3, this.place[0][1] + rectHeight/4]);
                    break;
                case 3:
                    this.userPlace.push([this.place[0][0] + rectWidth/4, this.place[0][1] + rectHeight/4]);
                    this.userPlace.push([this.place[0][0] + (rectWidth/4)*3, this.place[0][1] + rectHeight/4]);
                    this.userPlace.push([this.place[0][0] + rectWidth/4, this.place[0][1] + (rectHeight/4)*3]);
                    break;
                case 4:
                    this.userPlace.push([this.place[0][0] + rectWidth/4, this.place[0][1] + rectHeight/4]);
                    this.userPlace.push([this.place[0][0] + (rectWidth/4)*3, this.place[0][1] + rectHeight/4]);
                    this.userPlace.push([this.place[0][0] + rectWidth/4, this.place[0][1] + (rectHeight/4)*3]);
                    this.userPlace.push([this.place[0][0] + (rectWidth/4)*3, this.place[0][1] + (rectHeight/4)*3]);
                    break;
            }
        } else
            throw new Error("이미 유저가 설정되었습니다");
    }

    private drawUser() {
        if (this.userPlace.length === 0) throw new Error("유저가 설정되지 않았습니다");
        const colorList = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#00ffff", "#ff00ff"];
        this.userPlace.forEach((place, index) => {
            this.createCircle(place[0], place[1], 5, colorList[index] ?? this.createRandomColor());
        })
    }
    public moveUser(index: number, user: BoardGameData["memberCount"]) {
        if (this.userPlace.length === 0) throw new Error("유저가 설정되지 않았습니다")
        if (user!! > 4) throw new Error("유저의 인덱스가 너무 큽니다")
        const _this = this;
        const result:any[] = [];
        function moveTo(_index:number){
            if(_index > _this.data.content!!.length) result.push({status:"win",user:user})
            const [rectWidth, rectHeight] = [_this.canvas.width / _this.size, _this.canvas.height / _this.size];
            switch(user){
                case 1:
                    _this.userPlace[user!!-1] = [_this.place[_index][0] + rectWidth/4,_this.place[_index][1] + rectHeight/4]
                    break;
                case 2:
                    _this.userPlace[user!!-1] = [_this.place[_index][0] + (rectWidth/4)*3,_this.place[_index][1] + rectHeight/4]
                    break;
                case 3:
                    _this.userPlace[user!!-1] = [_this.place[_index][0] + rectWidth/4,_this.place[_index][1] + (rectHeight/4)*3]
                    break;
                case 4:
                    _this.userPlace[user!!-1] = [_this.place[_index][0] + (rectWidth/4)*3,_this.place[_index][1] + (rectHeight/4)*3]
                    break;
            }
            result.push({status:"move",move:_this.userPlace[user!!-1]})
        }

        moveTo(index)
        while(this.data.content[index].moveTo) moveTo(this.data.content[index].moveTo!!)
        this.update()
        return result;
    }
    public update(){
        this.drawOptions(this.data.content);
        this.drawUser();
        this.saveImage();
    }
    public startGame() {
        this.setBackground(this.data.background ?? this.createRandomColor()).then();
        this.drawOptions(this.data.content);
        this.setUser(this.data.memberCount);
        this.drawUser();
        this.saveImage();
        return this
    }
    public createBuffer() {
        return this.canvas.toBuffer();
    }

    public saveImage() {
        const out = fs.createWriteStream(__dirname + '/output.png');
        this.canvas.createPNGStream().pipe(out);
    }
}

export {_2048, BoardGame}