function ƒ(selector) {
    return document.querySelector(selector);
}

function ƒƒ(selector) {
    return [...document.querySelectorAll(selector)];
}

function ø(node, type, fn) {
    node.addEventListener(type, fn);
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

        ø(ƒ("[capture]"), "click", (evt) => {
            load_blobs(extract_blobs(this.inputs), paint_canvas);
            document.body.setAttribute("canvas_visible", String());
        });

        ø(ƒ("[reset]"), "click", (evt) => {
            // todo: properly reset inputs.
            document.body.removeAttribute("canvas_visible");
        });
    }
}

function extract_blobs(nodes) {
    return nodes
        .filter((node) => node.files.length)
        .map((node) => Object.assign(node, { blob: node.files[0] }));
}

function load_blobs(nodes, next) {
    nodes.forEach((node) => {
        const img = new Image();
        const url = URL.createObjectURL(node.blob);

        img.onload = () => {
            node.img = img;
            URL.revokeObjectURL(url);
            
            if (!nodes.filter((node) => !node.hasOwnProperty("img")).length)
                next(nodes);
        };

        img.src = url;
    });
}

function extract_captures(nodes) {
    return nodes.reduce((captures, node) => {
        switch(node.dataset.position) {
            case "detail": captures.detail.push(node.img); break;
            default: captures[node.dataset.position] = node.img; break;
        };
        return captures;
    }, {  left: null, right: null, detail: Array() });
}

function setup_canvas(captures, canvas, ctx) {
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

    canvas.width = ctx.width = w;
    canvas.height = ctx.height = h;
}

function render_images(captures, ctx) {
    ctx.drawImage(captures.left, captures.left.calculated.x, captures.left.calculated.y, captures.left.calculated.w, captures.left.calculated.h);
    ctx.drawImage(captures.right, captures.right.calculated.x, captures.right.calculated.y, captures.right.calculated.w, captures.right.calculated.h);

    if (captures.detail.length) {
        const detail = captures.detail[0];
        const frame_w = ctx.width;
        const frame_h = ctx.height / 2.25;

        const ratio = frame_w / detail.width;

        ctx.drawImage(
            detail,
            0, (detail.height - frame_h * ratio) / 2, detail.width, frame_h * ratio,
            0, captures.left.calculated.h, frame_w, frame_h
        );
    }
}

function render_text(text, ctx) {
    if (!text || !text.length)
        return;

    ctx.fillStyle = "rgba(255, 255, 255, .2)";
    ctx.font = `${ctx.height * .03}px system-ui`;
    ctx.textBaseline = "middle";
    const tm = ctx.measureText(text);

    const width = Math.abs(tm.actualBoundingBoxLeft) + Math.abs(tm.actualBoundingBoxRight);
    const height = Math.abs(tm.actualBoundingBoxAscent) + Math.abs(tm.actualBoundingBoxDescent);

    let x = ctx.width / 2 - width / 2;
    const y = ctx.height / 2 - (height) / 2;

    while(x + width > 0) x -= width * 1.75;
    while(x < ctx.width) {
        x += width * 1.25;
        ctx.fillText(text, x, y);
    };
}

function paint_canvas(nodes) {
    const canvas = document.querySelector("canvas");
    const ctx = canvas.getContext("2d", { alpha: false });
    const captures = extract_captures(nodes);

    setup_canvas(captures, canvas, ctx);
    render_images(captures, ctx);
    render_text(copyright_text, ctx);

    document.querySelector("img").src = document.querySelector("[download]").href = canvas.toDataURL("image/jpeg", 1);
}