import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { Chart, ChartConfiguration, ChartType, Plugin, registerables } from 'chart.js';
import path from 'path';

const fontsDir = path.join(process.cwd(), 'static', 'fonts');
GlobalFonts.registerFromPath(path.join(fontsDir, 'Inter-Regular.tff'), 'Inter');
GlobalFonts.registerFromPath(path.join(fontsDir, 'NotoColorEmoji.tff'), 'Noto Color Emoji');

Chart.register(...registerables);

Chart.defaults.color = '#dbdee1';
Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';
Chart.defaults.font.size = 16;
Chart.defaults.font.family = "Inter, 'Noto Color Emoji', 'Noto Sans Math', 'Noto Sans Symbols 2', sans-serif";

const background: Plugin = {
    id: 'background',
    beforeDraw(chart) {
        const { ctx, width, height } = chart;
        ctx.save();
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = '#2b2d31';
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
    }
}

export async function renderChart<T extends ChartType>(config: ChartConfiguration<T>, width: number = 1200, height: number = 600) {
    const canvas = createCanvas(width, height);

    const chart = new Chart(canvas, {
        ...config,
        options: {
            ...config.options,
            responsive: false,
            animation: false,
            devicePixelRatio: 1,
        },
        plugins: [...(config.plugins ?? []), background as Plugin<T>]
    } as ChartConfiguration<T>);

    const buffer = await canvas.encode('png');
    chart.destroy();
    return buffer;
}