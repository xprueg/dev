const ctx = canvas.getContext("2d")

const scale = 8
const ctxw = canvas.width = canvas.getBoundingClientRect().width / scale
const ctxh = canvas.height = canvas.getBoundingClientRect().height / scale

let active_color = "black"
ctx.lineWidth = 1
ctx.strokeStyle = "black"

class LineRenderer {
    constructor({ color }) {
        this.color = color
        this.fn = ctx.moveTo
        ctx.beginPath()
    }

    forceMoveToOnNextDraw() {
        this.fn = ctx.moveTo
    }

    draw(x, y) {
        this.fn.call(ctx, x, y)
        this.fn = ctx.lineTo
    }

    end() {
        ctx.save()
        ctx.strokeStyle = this.color
        ctx.stroke()
        ctx.restore()
    }
}

const lines = []
class Line {
    path = []
    window = 0
    color = active_color

    addPoint({ clientX, clientY, timeStamp }) {
        this.path.push({ x: clientX / scale, y: clientY / scale, ts: timeStamp })
    }

    finish() {
        const delta = this.path.at(0).ts
        for (const p of this.path)
            p.ts -= delta

        this.translate_x = this.path.at(-1).x - this.path.at(0).x
        this.translate_y = this.path.at(-1).y - this.path.at(0).y
        this.max_ts = this.path.at(-1).ts
    }

    moveWindowBy(ms) {
        this.window += ms

        if (this.window > this.max_ts) {
            this.window = 0
            for (const p of this.path) {
                p.x += this.translate_x
                p.y += this.translate_y
            }

            const shift_left = this.path.at(0).x >= ctxw
            if (shift_left)
                for (const p of this.path)
                    p.x -= ctxw

            const shift_right = this.path.at(-1).x <= ctxw
            if (shift_right)
                for (const p of this.path)
                    p.x += ctxw
        }

        return this
    }

    render() {
        const renderer = new LineRenderer({ color: this.color })
        const start = this.path.findIndex(({ ts }) => ts >= this.window)
        let wrap_x = 0
        let replay_x = 0
        let wrap_y = 0
        let replay_y = 0

        for (let i = 0; i < this.path.length; ++i) {
            const j = (i + start) % this.path.length
            let { x, y, ts } = this.path.at(j)

            if (ts < this.window) {
                x += this.translate_x
                y += this.translate_y
            }

            x += ctxw * wrap_x
            y += ctxh * wrap_y

            const extends_right = x > ctxw
            const extends_left = x < 0
            const out_of_bounds_x = --replay_x <= 0 && (extends_right || extends_left)
            const extends_top = y < 0
            const extends_bottom = y > ctxh
            const out_of_bounds_y = --replay_y <= 0 && (extends_top || extends_bottom)

            if (out_of_bounds_x || out_of_bounds_y) {
                if (out_of_bounds_x) {
                    if (extends_right) --wrap_x
                    else if (extends_left) ++wrap_x
                    replay_x = 2
                }

                if (out_of_bounds_y) {
                    if (extends_bottom) --wrap_y
                    else if (extends_top) ++wrap_y
                    replay_y = 2
                }

                if (i === 0) i -= 1; else {
                    renderer.draw(x, y)
                    renderer.forceMoveToOnNextDraw()
                    i -= 2
                }
            } else {
                renderer.draw(x, y)
            }
        }

        renderer.end()
    }
}

let active_line = null
let active_touch_lines = new Map()
let start, previous

function render(ts) {
    start ??= ts
    const elapsed = ts - previous || 0

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    lines.forEach(line => line.moveWindowBy(elapsed).render())
    active_line?.render()
    active_touch_lines.forEach(line => line.render())

    previous = ts
    requestAnimationFrame(render)
}

requestAnimationFrame(render)

canvas.addEventListener("mousedown", evt => {
    active_line = new Line()
    active_line.addPoint(evt)
})
canvas.addEventListener("mousemove", evt => {
    active_line?.addPoint(evt)
})
canvas.addEventListener("mouseup", _ => {
    active_line.finish()
    lines.push(active_line)
    active_line = null
})

canvas.addEventListener("touchstart", evt => {
    evt.preventDefault()

    const { timeStamp } = evt
    for (let i = 0; i < evt.changedTouches.length; ++i) {
        const { identifier, clientX, clientY } = evt.changedTouches.item(i)
        const line = new Line()
        line.addPoint({ clientX, clientY, timeStamp })

        active_touch_lines.set(identifier, line)
    }
})
canvas.addEventListener("touchmove", evt => {
    evt.preventDefault()

    const { timeStamp } = evt
    for (let i = 0; i < evt.changedTouches.length; ++i) {
        const { identifier, clientX, clientY } = evt.changedTouches.item(i)
        const line = active_touch_lines.get(identifier)

        line.addPoint({ clientX, clientY, timeStamp })
    }
})
canvas.addEventListener("touchend", evt => {
    evt.preventDefault()

    for (let i = 0; i < evt.changedTouches.length; ++i) {
        const { identifier } = evt.changedTouches.item(i)
        const line = active_touch_lines.get(identifier)

        line.finish()
        lines.push(line)
        active_touch_lines.delete(identifier)
    }
})
canvas.addEventListener("touchcancel", evt => {
    evt.preventDefault()
    for (let i = 0; i < evt.changedTouches.length; ++i) {
        const { identifier } = evt.changedTouches.item(i)
        active_touch_lines.delete(identifier)
    }
})

colorpicker.addEventListener("click", evt => {
    active_color = evt.target.style.background
})