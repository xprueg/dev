function ƒ(selector, base = document) {
    return base.querySelector(selector);
}

function ƒƒ(selector, base = document) {
    return [...base.querySelectorAll(selector)];
}

function ø(node, type, fn) {
    node.addEventListener(type, fn);
}

function µ(fn) {
    return new Promise(fn);
}

function input_to_img(node) {
    return µ((next) => {
        if (!node.files.length)
            next(null);

        const url = URL.createObjectURL(node.files[0]);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            next(img);
        };
        img.src = url;
    });
}

class Preview {
    constructor() {
        this.OVERLAY_KEY = "overlay";
        this.overlay = localStorage.getItem(this.OVERLAY_KEY);

        this.listen();
    }

    get inputs() {
        return ƒƒ("[type=file]");
    }

    static init(...args) {
        return new Preview(...args);
    }

    show_result(force) {
        document.body.setAttribute("canvas_visible", String(force));
    }

    listen() {
        this.inputs.forEach((input) => {
            // todo: Release ObjectUrl, remove img on reset.
            ø(input, "change", (evt) => {
                const file = evt.target.files[0];
                const img = ƒ("img", evt.target.parentNode);

                if (file) {
                    img.src = URL.createObjectURL(file);
                }
            });
        });

        ø(ƒ("[add-text]"), "click", (evt) => {
            this.overlay = prompt("💬");
            localStorage.setItem(this.OVERLAY_KEY, this.overlay);
        });

        ø(ƒ("[add-detail]"), "click", (evt) => {
            ƒ("[details]").appendChild(
                document.importNode(ƒ("template").content, true)
            );
        });

        ø(ƒ("[capture]"), "click", async (evt) => {
            const canvas = Canvas.new({
                left: await input_to_img(ƒ("[data-position=left]")),
                right: await input_to_img(ƒ("[data-position=right]")),
                detail: await ƒƒ("[data-position=detail]").reduce(
                    async (details, node) => details.concat(await input_to_img(node)),
                    Array()
                )
            }, this.overlay);

            ƒ("aside img").src = ƒ("[download]").href = canvas.self.toDataURL("image/jpeg", 1);

            this.show_result(true);
        });

        ø(ƒ("[reset]"), "click", (evt) => {
            this.inputs.forEach((input) => {
                input.value = String();

                const img = ƒ("img", input.parentNode);
                img.removeAttribute("src");
                img.height = img.width = 0;
            });

            this.show_result(false);
        });
    }
}

class Canvas {
    constructor(captures, overlay) {
        this.self = document.querySelector("canvas");
        this.ctx = this.self.getContext("2d", { alpha: false });

        this.captures = captures;
        this.overlay = overlay;

        this.resize();
        this.render_images();
        this.render_text();
    }

    static new(...args) {
        return new Canvas(...args);
    }

    resize() {
        let w = 0;
        let h = 0;

        if (this.captures.left) {
            w += this.captures.left.width / 2;
            h += this.captures.left.height / 2;
            this.captures.left.calculated = {
                x: 0,
                y: 0,
                w: this.captures.left.width / 2,
                h: this.captures.left.height / 2
            };
        }

        if (this.captures.right) {
            w += this.captures.right.width / 2;
            this.captures.right.calculated = {
                x: this.captures.left.calculated.w,
                y: 0,
                w: this.captures.right.width / 2,
                h: this.captures.right.height / 2
            };
        }

        if (this.captures.detail.length) {
            h += h / 2.25;
        }

        this.self.width = this.ctx.width = w;
        this.self.height = this.ctx.height = h;
    }

    render_images() {
        this.ctx.drawImage(this.captures.left, this.captures.left.calculated.x, this.captures.left.calculated.y, this.captures.left.calculated.w, this.captures.left.calculated.h);
        this.ctx.drawImage(this.captures.right, this.captures.right.calculated.x, this.captures.right.calculated.y, this.captures.right.calculated.w, this.captures.right.calculated.h);

        if (this.captures.detail.length) {
            const detail = this.captures.detail[0];
            const frame_w = this.ctx.width;
            const frame_h = this.ctx.height / 2.25;

            const ratio = frame_w / detail.width;

            this.ctx.drawImage(
                detail,
                0, (detail.height - frame_h * ratio) / 2, detail.width, frame_h * ratio,
                0, this.captures.left.calculated.h, frame_w, frame_h
            );
        }
    }

    render_text() {
        if (!this.overlay || !this.overlay.length)
            return;

        this.ctx.fillStyle = "rgba(255, 255, 255, .2)";
        this.ctx.font = `bold ${this.ctx.height * .03}px system-ui`;
        this.ctx.textBaseline = "middle";
        const tm = this.ctx.measureText(this.overlay);

        const width = Math.abs(tm.actualBoundingBoxLeft) + Math.abs(tm.actualBoundingBoxRight);
        const height = Math.abs(tm.actualBoundingBoxAscent) + Math.abs(tm.actualBoundingBoxDescent);

        let x = this.ctx.width / 2 - width / 2;
        const y = this.ctx.height / 2 - (height) / 2;

        while(x + width > 0) x -= width * 1.75;
        while(x < this.ctx.width) {
            x += width * 1.75;
            this.ctx.fillText(this.overlay, x, y);
        };
    }
}