function ƒ(selector) {
    return document.querySelector(selector);
}

function ƒƒ(selector) {
    return [...document.querySelectorAll(selector)];
}

function ø(node, type, fn) {
    node.addEventListener(type, fn);
}

function µ(fn) {
    return new Promise(fn);
}

class Preview {
    constructor() {
        this.canvas = document.querySelector("canvas");
        this.ctx = this.canvas.getContext("2d", { alpha: false });
        this.overlay = null;

        this.listen();
    }

    get inputs() {
        return ƒƒ("[type=file]");
    }

    static init(...args) {
        return new Preview(...args);
    }

    listen() {
        ø(ƒ("[add-text]"), "click", (evt) => {
            this.overlay = prompt("💬");
        });

        ø(ƒ("[add-detail]"), "click", (evt) => {
            ƒ("[details]").appendChild(
                document.importNode(ƒ("template").content, true)
            );
        });

        ø(ƒ("[capture]"), "click", async (evt) => {
            let data = this.create_data_objects();
            data = this.extract_blobs(data);
            data = await this.load_images(data);

            this.paint_canvas(this.extract_captures(data));

            document.body.setAttribute("canvas_visible", String());
        });

        ø(ƒ("[reset]"), "click", (evt) => {
            // todo: Reset/Reload overlay from local storage.

            // todo: properly reset inputs.
            document.body.removeAttribute("canvas_visible");
        });
    }

    create_data_objects() {
        return this.inputs.reduce((data, input) => {
            return data.concat({
                node: input,
                blob: null,
                img: null,
            });
        }, Array());
    }

    extract_blobs(data) {
        return data
            .filter((obj) => obj.node.files.length)
            .map((obj) => Object.assign(obj, { blob: obj.node.files[0] }));
    }

    load_images(data) {
        return µ((next) => {
            data.forEach((obj) => {
                const img = new Image();
                const url = URL.createObjectURL(obj.blob);

                img.onload = () => {
                    obj.img = img;
                    URL.revokeObjectURL(url);
 
                    if (!data.filter((obj) => !obj.hasOwnProperty("img")).length)
                        next(data);
                };

                img.src = url;
            });
        });
    }

    extract_captures(data) {
        const captures = {
            left: null,
            right: null,
            detail: Array()
        };

        data.forEach((obj) => {
            console.log(obj.node);
            console.log(obj.node.dataset.position);
            switch(obj.node.dataset.position) {
                case "detail": captures.detail.push(obj.img); break;
                default: captures[obj.node.dataset.position] = obj.img; break;
            };
        });
console.log(captures);
        return captures;
    }

    setup_canvas(captures) {
        let w = 0;
        let h = 0;

        if (captures.left) {
            w += captures.left.width / 2;
            h += captures.left.height / 2;
            captures.left.calculated = {
                x: 0,
                y: 0,
                w: captures.left.width / 2,
                h: captures.left.height / 2
            };
        }

        if (captures.right) {
            w += captures.right.width / 2;
            captures.right.calculated = {
                x: captures.left.calculated.w,
                y: 0,
                w: captures.right.width / 2,
                h: captures.right.height / 2
            };
        }

        if (captures.detail.length) {
            h += h / 2.25;
        }

        this.canvas.width = this.ctx.width = w;
        this.canvas.height = this.ctx.height = h;
    }

    render_images(captures) {
        console.log(captures);
        this.ctx.drawImage(captures.left, captures.left.calculated.x, captures.left.calculated.y, captures.left.calculated.w, captures.left.calculated.h);
        this.ctx.drawImage(captures.right, captures.right.calculated.x, captures.right.calculated.y, captures.right.calculated.w, captures.right.calculated.h);

        if (captures.detail.length) {
            const detail = captures.detail[0];
            const frame_w = this.ctx.width;
            const frame_h = this.ctx.height / 2.25;

            const ratio = frame_w / detail.width;

            this.ctx.drawImage(
                detail,
                0, (detail.height - frame_h * ratio) / 2, detail.width, frame_h * ratio,
                0, captures.left.calculated.h, frame_w, frame_h
            );
        }
    }

    render_text() {
        if (!this.overlay || !this.overlay.length)
            return;

        this.ctx.fillStyle = "rgba(255, 255, 255, .2)";
        this.ctx.font = `${this.ctx.height * .03}px system-ui`;
        this.ctx.textBaseline = "middle";
        const tm = this.ctx.measureText(this.overlay);

        const width = Math.abs(tm.actualBoundingBoxLeft) + Math.abs(tm.actualBoundingBoxRight);
        const height = Math.abs(tm.actualBoundingBoxAscent) + Math.abs(tm.actualBoundingBoxDescent);

        let x = this.ctx.width / 2 - width / 2;
        const y = this.ctx.height / 2 - (height) / 2;

        while(x + width > 0) x -= width * 1.75;
        while(x < this.ctx.width) {
            x += width * 1.25;
            this.ctx.fillText(this.overlay, x, y);
        };
    }

    paint_canvas(captures) {
        this.setup_canvas(captures);
        this.render_images(captures);
        this.render_text();

        ƒ("img").src = ƒ("[download]").href = this.canvas.toDataURL("image/jpeg", 1);
    }
}