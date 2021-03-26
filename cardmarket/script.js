const pic_size = {
    width: 3024 / 2,
    height: 4032 / 2,
  };

  const canvas_size = {
    width: pic_size.width * 2,
    height: pic_size.height,
  };

  const canvas = document.querySelector("canvas");
  const ctx = canvas.getContext("2d", { alpha: false });

  // fix: actually readraw the canvas.
  let y = 0;
  function resize_canvas(w, h) {
    if (y++ > 0) return;

    console.log("[resize_canvas]", w, h / 2);
    canvas.width = ctx.width = w;
    canvas.height = ctx.height = h / 2;
  }

  function draw_image(position, img, w, h) {
    console.log("[draw_image]", img, w / 2, h / 2);
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

  Array.from(document.querySelectorAll("[type=file]"))
       .forEach((input) => {
        input.addEventListener("change", (evt) => {
          const file = evt.target.files[0];

          blob_to_img(file, (img) => {
            const [width, height] = [img.width, img.height];
            resize_canvas(width, height);
            draw_image(evt.target.dataset.position, img, width, height);
          });
       });
  });

  const blob_to_img = (blob, callback) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      callback(img);
    }
    img.src = url;
  };

  document.querySelector("button").addEventListener("click", ((_) => {
    document.body.setAttribute("canvas_visible", String());

    // const files = [
    //   document.querySelector("input[data-left-image]").files[0],
    //   document.querySelector("input[data-right-image]").files[0]
    // ];
    
    // const canvas = document.querySelector("canvas");
    // const ctx = canvas.getContext("2d", {alpha: false});

    // ctx.width = canvas.width = canvas_size.width;
    // ctx.height = canvas.height = canvas_size.height;

    // blob_to_img(files[0], (img) => {
    //   ctx.drawImage(img, 0, 0, pic_size.width, pic_size.height);

    //   blob_to_img(files[1], (img) => {
    //     ctx.drawImage(img, canvas.width / 2, 0, pic_size.width, pic_size.height);

    //     const text = prompt() || "xpr.org";
    //     const x = canvas_size.width / 2 - ctx.measureText(text).width / 2;
    //     const y = canvas_size.height / 2 - ctx.measureText(text).height / 2;

    //     ctx.fillStyle = "white";
    //     ctx.strokeStyle = 'black';
    //     ctx.font = `${canvas_size.height * .05}px system-ui`;
    //     ctx.textBaseline = "bottom";
    //     ctx.lineWidth = canvas_size.heihgt * .004;

    //     ctx.strokeText(text, x, y);
    //     ctx.fillText(text, x, y);

    //     document.querySelector("img[data-output]").src = canvas.toDataURL("image/jpeg", 1);
    //   });
    // });
  }));