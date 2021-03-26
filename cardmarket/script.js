const pic_size = {
    width: 3024 / 2,
    height: 4032 / 2,
  };

  const canvas_size = {
    width: pic_size.width * 2,
    height: pic_size.height,
  };


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

    canvas.width = ctx.width = w;
    canvas.height = ctx.height = h;
}

function render_images(captures, canvas, ctx) {
    ctx.drawImage(captures.left, captures.left.calculated.x, captures.left.calculated.y, captures.left.calculated.w, captures.left.calculated.h);
    ctx.drawImage(captures.right, captures.right.calculated.x, captures.right.calculated.y, captures.right.calculated.w, captures.right.calculated.h);
}

function paint_canvas(nodes) {
    const canvas = document.querySelector("canvas");
    const ctx = canvas.getContext("2d", { alpha: false });
    const captures = extract_captures(nodes);

    setup_canvas(captures, canvas, ctx);
    render_images(captures, canvas, ctx);

    document.querySelector("img").src = canvas.toDataURL("image/jpeg", 1);
}

const inputs = [...document.querySelectorAll("[type=file]")];

document.querySelector("[capture]").addEventListener("click", () => {
    load_blobs(extract_blobs(inputs), paint_canvas);

    document.body.setAttribute("canvas_visible", String());
});

document.querySelector("[reset]").addEventListener("click", () => {
    // todo: properly reset inputs.
    document.body.removeAttribute("canvas_visible");
});

  // fix: actually readraw the canvas.
//   let y = 0;
//   function resize_canvas(w, h) {
//     if (y++ > 0) return;

//     canvas.width = ctx.width = w;
//     canvas.height = ctx.height = h / 2;
//   }

  function draw_image(position, img, w, h) {
    switch(position) {
      case "main-left":
        ctx.drawImage(img, 0, 0, w / 2, h / 2);
        break;
      case "main-right":
        ctx.drawImage(img, w / 2, 0, w / 2, h / 2);
        break;
      default:
        throw Error(`Unkown position \`${position}'.`);
        break;
    }
  }

// Array.from(document.querySelectorAll("[type=file]"))
//     .forEach((input) => {
//     input.addEventListener("change", (evt) => {
//         const file = evt.target.files[0];

//         blob_to_img(file, (img) => {
//         const [width, height] = [img.width, img.height];
//         resize_canvas(width, height);
//         draw_image(evt.target.dataset.position, img, width, height);
//         });
//     });
// });

  const blob_to_img = (blob, callback) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      callback(img);
    }
    img.src = url;
  };

//   document.querySelector("button").addEventListener("click", ((_) => {
//     document.body.setAttribute("canvas_visible", String());

//     // const files = [
//     //   document.querySelector("input[data-left-image]").files[0],
//     //   document.querySelector("input[data-right-image]").files[0]
//     // ];
    
//     // const canvas = document.querySelector("canvas");
//     // const ctx = canvas.getContext("2d", {alpha: false});

//     // ctx.width = canvas.width = canvas_size.width;
//     // ctx.height = canvas.height = canvas_size.height;

//     // blob_to_img(files[0], (img) => {
//     //   ctx.drawImage(img, 0, 0, pic_size.width, pic_size.height);

//     //   blob_to_img(files[1], (img) => {
//     //     ctx.drawImage(img, canvas.width / 2, 0, pic_size.width, pic_size.height);

//     //     const text = prompt() || "xpr.org";
//     //     const x = canvas_size.width / 2 - ctx.measureText(text).width / 2;
//     //     const y = canvas_size.height / 2 - ctx.measureText(text).height / 2;

//     //     ctx.fillStyle = "white";
//     //     ctx.strokeStyle = 'black';
//     //     ctx.font = `${canvas_size.height * .05}px system-ui`;
//     //     ctx.textBaseline = "bottom";
//     //     ctx.lineWidth = canvas_size.heihgt * .004;

//     //     ctx.strokeText(text, x, y);
//     //     ctx.fillText(text, x, y);

//     //     document.querySelector("img[data-output]").src = canvas.toDataURL("image/jpeg", 1);
//     //   });
//     // });
//   }));