function ƒ(selector, base = document) {
    return base.querySelector(selector);
}

function ƒƒ(selector, base = document) {
    return [...base.querySelectorAll(selector)];
}

function ø(node, type, fn) {
    if (Array.isArray(node))
        return void node.forEach((n) => ø(n, type, fn));

    node.addEventListener(type, fn);
}

function µ(fn) {
    return new Promise(fn);
}

function get_image_from(node) {
    return µ((next) => {
        if (!node.files.length)
            next(null);

        const url = URL.createObjectURL(node.files[0]);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);

            img.width /= 3;
            img.height /= 3;

            next(img);
        };
        img.src = url;
    });
}

// • Listener

ø(ƒƒ("[type=file]"), "change", (evt) => {
    Canvas.repaint((data) => ƒ("img").src = data);
});

ø(ƒ("[set_watermark]"), "click", (evt) => {
    const current = localStorage.getItem("watermark");
    const watermark = prompt(
        "Set your Watermark.",
        current !== null ? current : String()
    );

    if (watermark == null)
        return;

    localStorage.setItem("watermark", watermark);
    Canvas.repaint((data) => ƒ("img").src = data);
});

// • Canvas

class Canvas {
    constructor(next) {
        this.next = next;
        this.self = ƒ("canvas");
        this.ctx = this.self.getContext("2d", { alpha: false });

        this.init();
    }

    static repaint(next) {
        new Canvas(next);
    }

    async init() {
        await this.load();

        if (this.front === null && this.back === null)
            return;

        this.resize();
        this.paint();

        this.next(this.self.toDataURL("image/jpeg", 1));
    }

    async load() {
        this.front = await get_image_from(ƒ("[front]"));
        this.back = await get_image_from(ƒ("[back]"));
        this.watermark = localStorage.getItem("watermark");
    }

    resize() {
        this.width = 0;
        this.height = 0;

        [this.front, this.back].forEach((img) => {
            if (img === null)
                return;

            this.width = this.width + img.width;
            this.height = this.height === 0
                ? img.height
                : Math.min(this.height, img.height);
        });

        this.self.width = this.ctx.width = this.width;
        this.self.height = this.ctx.height = this.height;
    }

    paint() {
        if (this.front)
            this.ctx.drawImage(this.front, 0, 0, this.front.width, this.front.height);

        if (this.back)
            this.ctx.drawImage(this.back, this.front ? this.front.width : 0, 0,
                               this.back.width, this.back.height);

        if (this.watermark && this.watermark.length)
            this.paint_watermark();
    }

    paint_watermark() {
        this.ctx.fillStyle = "rgba(255, 255, 255, .2)";
        this.ctx.font = `bold ${this.ctx.height * .03}px system-ui`;
        this.ctx.textBaseline = "middle";
        const tm = this.ctx.measureText(this.watermark);

        const width = Math.abs(tm.actualBoundingBoxLeft) + Math.abs(tm.actualBoundingBoxRight);
        const height = Math.abs(tm.actualBoundingBoxAscent) + Math.abs(tm.actualBoundingBoxDescent);

        let x = this.ctx.width / 2 - width / 2;
        const y = this.ctx.height / 2 - (height) / 2;

        while(x + width > 0) x -= width * 1.75;
        while(x < this.ctx.width) {
            x += width * 1.75;
            this.ctx.fillText(this.watermark, x, y);
        };
    }
}