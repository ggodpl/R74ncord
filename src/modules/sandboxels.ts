import { Canvas } from "canvas";

/// TINY SANDBOXELS INSTANCE
export interface Pixel {
    x: number;
    y: number;
    color: string;
    finished: boolean;
}

export class Sandboxels {
    width: number;
    height: number;
    pixels: Pixel[];
    baseColor: [number, number, number];
    private grid: Map<number, Pixel>;

    constructor (width: number, height: number, baseColor: [number, number, number]) {
        this.width = width;
        this.height = height;
        this.pixels = [];
        this.baseColor = baseColor;
        this.grid = new Map();
    }

    private getKey(x: number, y: number): number {
        return y * this.width + x;
    }

    createPixel(x: number, y: number) {
        const key = this.getKey(x, y);
        const existing = this.grid.get(key);
        
        if (existing) {
            const index = this.pixels.indexOf(existing);
            if (index > -1) this.pixels.splice(index, 1);
        }

        const pixel = {
            x,
            y,
            color: this.pickColor(),
            finished: false,
        };

        this.pixels.push(pixel);
        this.grid.set(key, pixel);
    }

    pickColor() {
        const colorOffset = Math.floor(Math.random() * (Math.random() > 0.5 ? -1 : 1) * Math.random() * 15);
        const r = Math.max(0, Math.min(255, this.baseColor[0] + colorOffset));
        const g = Math.max(0, Math.min(255, this.baseColor[1] + colorOffset));
        const b = Math.max(0, Math.min(255, this.baseColor[2] + colorOffset));

        return `rgb(${r}, ${g}, ${b})`;
    }

    pixelAt(x: number, y: number) {
        return this.grid.get(this.getKey(x, y));
    }

    hasFinished(x: number, y: number) {
        if (this.outOfBounds(x, y)) return true;
        const pixel = this.pixelAt(x, y);
        return pixel && pixel.finished;
    }

    tickPowder(pixel: Pixel) {
        if (pixel.finished) return;
        if (pixel.y == 0 || (
            this.hasFinished(pixel.x + 1, pixel.y - 1) &&
            this.hasFinished(pixel.x, pixel.y - 1) &&
            this.hasFinished(pixel.x - 1, pixel.y - 1))
        ) {
            pixel.finished = true;
            return;
        }

        if (!this.tryMove(pixel, pixel.x, pixel.y - 1)) {
            if (Math.random() < 0.5) {
                if (!this.tryMove(pixel, pixel.x + 1, pixel.y - 1)) {
                    this.tryMove(pixel, pixel.x - 1, pixel.y - 1);
                }
            } else if (!this.tryMove(pixel, pixel.x - 1, pixel.y - 1)) {
                this.tryMove(pixel, pixel.x + 1, pixel.y - 1);
            }
        }
    }

    isEmpty(x: number, y: number) {
        return !this.grid.has(this.getKey(x, y));
    }

    outOfBounds(x: number, y: number) {
        return x < 0 || y < 0 || x >= this.width || y >= this.height;
    }

    tryMove(pixel: Pixel, x: number, y: number) {
        if (!this.isEmpty(x, y)) return false;
        if (this.outOfBounds(x, y)) return false;

        this.move(pixel, x, y);
        return true;
    }

    move(pixel: Pixel, x: number, y: number) {
        this.grid.delete(this.getKey(pixel.x, pixel.y));
        pixel.x = x;
        pixel.y = y;
        this.grid.set(this.getKey(x, y), pixel);
    }

    isFinished() {
        return this.pixels.every(p => p.finished);
    }

    simulate() {
        let i = 0;

        while (!this.isFinished() && i < this.width * this.height) {
            this.tick();
            i++;
        }
    }

    tick() {
        this.pixels.forEach(p => this.tickPowder(p));
    }

    render(pixelSize: number) {
        const width = this.width * pixelSize;
        const height = this.height * pixelSize;
        const canvas = new Canvas(width, height);
        const ctx = canvas.getContext("2d");

        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, width, height);

        for (const pixel of this.pixels) {
            ctx.fillStyle = pixel.color;
            ctx.fillRect(pixel.x * pixelSize, (this.height - 1 - pixel.y) * pixelSize, pixelSize, pixelSize);
        }

        return canvas.toBuffer();
    }
}