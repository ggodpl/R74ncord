import { Canvas, Image, loadImage, registerFont } from "canvas";
import { Initializable } from "../base";
import { Sandboxels } from "./sandboxels";

export interface RankData {
    rank: number;
    level: number;
    xp: number;
    max: number;
    totalXp: number;
}

export class RankCard {
    static initialize() {
        registerFont("static/fonts/PressStart2P-Regular.ttf", { family: "Press Start 2P Regular" });
    }

    static fill(sandboxels: Sandboxels, rankData: RankData) {
        const maxPixels = sandboxels.width * sandboxels.height;

        let target = Math.min(maxPixels, Math.ceil((maxPixels) * (rankData.xp / rankData.max)));
        if (target == maxPixels && rankData.xp < rankData.max) target -= 1;

        const free: number[] = [];
        for (let i = 0; i < maxPixels; i++) {
            free.push(i);
        }

        for (let i = 0; i < target; i++) {
            const random = Math.floor(Math.random() * free.length);
            const index = free[random];

            const x = Math.floor(index / sandboxels.height);
            const y = index % sandboxels.height;

            sandboxels.createPixel(x, y);

            free.splice(random, 1);
        }

        sandboxels.simulate();

        // while (filled < target) {
        //     let free = Array(sandboxels.width).fill(0).map((_, i) => i).filter(p => sandboxels.isEmpty(p, top));

        //     if (free.length > sandboxels.width / 4) {
        //         const clone = [];
        //         for (const i of Array(sandboxels.width / 4).fill(0).map(_ => Math.floor(Math.random() * free.length))) {
        //             clone.push(free[i]);
        //         }

        //         free = clone;
        //     }

        //     filled += free.length;

        //     free.forEach(p => sandboxels.createPixel(p, top));

        //     sandboxels.simulate();
        // }
    }

    static async generateAvatarContext(avatarURL: string) {
        const size = 85
        const canvas = new Canvas(size, size);
        const ctx = canvas.getContext("2d");

        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();

        const avatar = await loadImage(avatarURL);

        ctx.drawImage(avatar, 0, 0, size, size);

        return canvas.toBuffer();
    }

    static async generateRankCard(avatarURL: string, username: string, rankData: RankData) {
        const width = 500;
        const height = 200;
        const canvas = new Canvas(width, height);
        const ctx = canvas.getContext("2d");

        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, width, height);

        const pixelSize = 5;
        const sandboxels = new Sandboxels(width / pixelSize, height / pixelSize, [230, 213, 119]);
        this.fill(sandboxels, rankData);

        const bg = await loadImage(sandboxels.render(pixelSize));

        ctx.drawImage(bg, 0, 0, width, height);

        const front = await loadImage("static/img/card_front.png");
        const frontWidth = 448;
        const frontHeight = 161;
        const imageOffsetX = (canvas.width - frontWidth) / 2;
        const imageOffsetY = (canvas.height - frontHeight) / 2;

        ctx.drawImage(front, imageOffsetX, imageOffsetY, frontWidth, frontHeight);

        const avatarOffsetX = 41;
        const avatarOffsetY = 73;
        const avatarSize = 85;
        
        const avatar = await loadImage(await this.generateAvatarContext(avatarURL));
        ctx.drawImage(avatar, avatarOffsetX, avatarOffsetY, avatarSize, avatarSize);

        ctx.fillStyle = "#fff";
        ctx.font = '20px "Press Start 2P Regular"';
        ctx.fillText(username, imageOffsetX + 10, imageOffsetY + 30);
        
        const usernameWidth = ctx.measureText(username).width;
        ctx.fillRect(imageOffsetX + 10, imageOffsetY + 32, usernameWidth, 2);

        const levelOffset = avatarOffsetX + avatarSize + 20;

        ctx.fillStyle = "#7F7F7F";
        ctx.font = '10px "Press Start 2P Regular"';
        const rankWidth = ctx.measureText(`#${rankData.rank}`).width;
        ctx.fillText(`#${rankData.rank}`, imageOffsetX + frontWidth - rankWidth - 10, imageOffsetY + 20);
        ctx.fillText(`${rankData.xp}/${rankData.max}`, levelOffset, avatarOffsetY + 30);
        ctx.fillText(`Total: ${rankData.totalXp}`, levelOffset, avatarOffsetY + 45);

        ctx.fillStyle = "#fff";
        ctx.font = '15px "Press Start 2P Regular"';
        ctx.fillText(`Level: ${rankData.level}`, levelOffset, avatarOffsetY + 15);

        return canvas.toBuffer();
    }
}