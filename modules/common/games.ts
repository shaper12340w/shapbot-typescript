import { Canvas, CanvasRenderingContext2D, createCanvas } from "canvas";
import { EmbedBuilder } from "discord.js"

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
    private canvas:Canvas;
    private ctx:CanvasRenderingContext2D;
    private board:number[][];
    private flag = -1;
    private score = 0;
    public size = 4;
    public embed:EmbedBuilder;
    
    constructor() {
        this.canvas = createCanvas(400, 400);
        this.ctx = this.canvas.getContext("2d");
        this.board = Array.from({ length: this.size }, () => new Array(this.size).fill(0));
        this.embed = new EmbedBuilder();
    }
    private makeCanvas(num:number){
        this.board = Array(num).fill(0).map(() => Array(num).fill(0));
        return createCanvas(num*100,num*100);
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
            return {status:"start",score:this.score,image:this.saveImage()}
        } else {
            return {status:"already"}
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
                    emptyTiles.push({ row, col });
                }
            }
        }
        if (emptyTiles.length) {
            const { row, col } = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
            this.board[row][col] = Math.random() < 0.9 ? 2 : 4;
        }
    }
    public move(direction:string) {
        let moved = false;
        for (let i = 0; i < this.size; i++) {
            const tiles:number[] = [];
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
            console.log("score:" + this.score)
            console.log("-----------")
            console.log(this.board.join('\n'))
            console.log("-----------")
            this.addTile();
            this.drawBoard();
            this.flag = 0;
            return {status:"proceeding",score:this.score,image:this.saveImage()};
        }
        else if (this.isWin()) {
            console.log("You Win!");
            this.drawWin();
            this.flag = 1;
            return {status:"win",score:this.score,image:this.saveImage()};
        }
        else if (this.isGameOver()) {
            console.log("Game over!");
            this.drawGameOver();
            this.flag = 2;
            return {status:"lose",score:this.score,image:this.saveImage()};
        }
        else {
            return false
        }
    }
    private mergeTiles(tiles:number[]) {
        const merged:number[] = [];
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

    private drawGameOver() {
        this.ctx.fillStyle = '#776E65';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 60px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Game Over', this.canvas.width / 2, this.canvas.height / 2);
    }

    private drawWin() {
        this.ctx.fillStyle = '#776E65';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 60px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('You Win!', this.canvas.width / 2, this.canvas.height / 2);
    }

    private saveImage() {
        return this.canvas.toBuffer();
    }
}

export { _2048 }