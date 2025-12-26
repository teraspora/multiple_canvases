// Main Javascript file for Multiple Canvases
// John Lynch - January 2024

class Scene {
    static instance_count = 0;
    constructor(canvas) {
        this.id = Scene.instance_count++;
        this.canvas = canvas;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.progress = 0;
        this.progress_delta = this.id * 4 + 1;
    }
    render() {
    }
    update(t) {
        this.progress += this.progress_delta;
    }
    test() {
        // Insert test that works on any canvas type
    }
}

class Scene2d extends Scene {
    static instance_count = 0;
    constructor(canvas) {
        super(canvas);
        this.ctx = this.canvas.getContext("2d");
        this.hue_initial = Math.random() * 360;
    }
    render() {
        super.render();
    }
    update(t) {
        super.update();
    }
    test() {
        // Draw something simple and small, just to verify canvas drawability!
        this.ctx.fillStyle = `hsl(${Math.random() * 360} 100% 50%)`;
        this.ctx.fillRect(8, 8, 16, 16);
    }
}

class StaticScene extends Scene2d {
    constructor(canvas) {
        super(canvas);
        this.centre = [this.width / 2, this.height / 2];
    }
    render() {
        super.render();
        this.ctx.beginPath();
        this.ctx.fillStyle = '#18f';
        this.ctx.lineWidth = 3;
        this.ctx.shadowColor = "#fda";
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowBlur = 15;
        this.ctx.arc(...this.centre, 64, 0.4 * Math.PI, 0.6 * Math.PI, true);
        this.ctx.lineTo(...this.centre);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.strokeStyle = '#fda';
        this.ctx.stroke();
    }
    test() {
        // Draw something simple and small, just to verify canvas drawability!
        this.ctx.fillStyle = `hsl(${Math.random() * 360} 100% 50%)`;
        this.ctx.lineWidth = 4;
        this.ctx.strokeStyle = '#2cf';
        this.ctx.shadowColor = "#fff";
        this.ctx.shadowOffsetX = 10;
        this.ctx.shadowBlur = 50;
        this.ctx.fillRect(80, 80, 160, 160);
        this.ctx.rect(this.width - 200, this.height - 150, 50, 50);
        this.ctx.fill();
        this.ctx.stroke();
    }

}

class VideoScene extends Scene2d {
    constructor(canvas, video) {
        super(canvas);
        this.video = video;
    }
    render() {
        super.render();
        // Initiate playing video
        this.video.play();
        requestAnimationFrame(this.update.bind(this));
    }
    update(t) {
        super.update();
        if (!this.video.paused && !this.video.ended) {
            // Display next frame
            this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
        }
        requestAnimationFrame(this.update.bind(this));
    }
}

class CurveScene extends Scene2d {   
    // Curves
    static curves = {
        rhodonea: (k, amp, t) => [
            amp * Math.cos(k * t + t) * Math.cos(t),
            amp * Math.cos(k * t + t) * Math.sin(t),
        ],
        ellipse: (a, b, t) => [
            a * Math.cos(t),
            b * Math.sin(t)
        ],
        wobbly_spiral: (r, density, x_wobble_amp, y_wobble_amp, x_wobble_freq, y_wobble_freq, t) => {
            const r_ = r * (density * Math.PI - t) / (density * Math.PI);
            return [
                r_ * Math.cos(-t) + x_wobble_amp * Math.sin(t * x_wobble_freq),
                r_ * Math.sin(-t) + y_wobble_amp * Math.cos(t * y_wobble_freq)
            ];
        },
        trig_grid: (p, q, t) => {
            const amplitude = 200;
            return [            
                amplitude * Math.sin(p * Math.PI * t / 10),
                amplitude * Math.cos(q * Math.PI * t / 10)
            ]
        },
        hcrr: (R, r, amp, t) => {
            const s = R - r;
            return [
                amp * (s * Math.cos(t) + r * Math.cos(s / r * t)),
                amp * (s * Math.sin(t) - r * Math.sin(s / r * t))
            ]
        },
        wobbly_hcrr: (R, r, amp, t) => {
            const s = R - r;
            return [
                amp * (s * Math.cos(t) + r * Math.cos(s / r * t)) + 6 * Math.sin(t * 100),
                amp * (s * Math.sin(t) - r * Math.sin(s / r * t))
            ]
        },
        hypocycloid: (a, b, amp, t) => {
            const r = a - b;
            const p = r / b;
            return [
                amp * (r * Math.cos(t) + b * Math.cos(p * t)),
                amp * (r * Math.sin(t) - b * Math.sin(p * t))
            ]
        },
        spiral: (r, density, t) => {
            const r_ = r * (density * Math.PI - t) / (density * Math.PI);
            return [
                r_ * Math.cos(-t),
                r_ * Math.sin(-t)
            ];
        },
        unknown: (a, b, c, d, e, f, g, amp, t) => {
            const t_ = t / 10;
            return [
                amp * (Math.cos(a * t_) + Math.cos(b * t_) / d + Math.sin(c * t_) / e),
                amp * (Math.sin(a * t_) + Math.sin(b * t_) / f + Math.cos(c * t_) / g)
            ];
        }
    };
    // =========================================

    constructor(canvas, curve, params, thickness) {
        super(canvas);
        this.ctx.lineWidth = thickness;
        this.curve_name = curve;
        this.curve = CurveScene.curves[this.curve_name];
        this.params = params;
        this.x_previous = 0;
        this.y_previous = 0;
    }

    render() {
        // Called by user subsequent to instantiation.   Kicks off the animation.
        super.render();
        const [x, y] = this.curve(...this.params, 0);
        this.x_previous = x + this.width / 2;
        this.y_previous = y + this.height / 2;
        if (show_curve_info) {
            this.ctx.font = "16px monospace";
            this.ctx.fillStyle = '#4df';
            this.ctx.shadowColor = "#fda";
            this.ctx.shadowOffsetX = 2;
            this.ctx.shadowBlur = 15;
            this.ctx.fillText(this.curve_name, this.width - 120, this.height - 50);
            this.ctx.fillText(`(${this.params})`, this.width - 12 * this.params.toString().length - 20, this.height - 20);
        }
        requestAnimationFrame(this.update.bind(this));
    }

    update() {
        // Called for every repaint, by requestAnimationFrame()
        super.update();
        const [x, y] = this.curve(...this.params, this.progress);
        const [x_next, y_next] = [x + this.width / 2, y + this.height / 2];
        this.ctx.strokeStyle = `hsl(${this.hue_initial + this.progress * 100} 100% 50%)`;
        this.ctx.moveTo(this.x_previous, this.y_previous);
        this.ctx.lineTo(x_next, y_next);
        [this.x_previous, this.y_previous] = [x_next, y_next];
        this.ctx.stroke();
        this.ctx.beginPath();            
        requestAnimationFrame(this.update.bind(this));
    }
}

class Atom {
    // position and velocity should be abjects with keys x and y;
    // position values should be in the range [0, 1]; they will get multiplied by canvas dimensions in draw() method
    // velocity is also as a proportion of canvas dimensions
    // gravity specifies the level of attraction  to other atoms; how close they need to be, in pixels, to connect
    static instance_count = 0;
    constructor(radius, colour, position, velocity, gravity, trail_length) {
        this.id = Atom.instance_count++;
        this.radius = radius;
        this.colour = colour;
        this.position = position;
        this.velocity = velocity;
        this.gravity = gravity;
        this.trail_length = trail_length;
        this.trailpoints = [[this.position.x, this.position.y]];
        this.hue_initial = Math.random() * 360;
    }
    draw(ctx, scene_id) {
        if (scene_id != 1) {    // For Scene 1, don't draw the actual atoms!
            ctx.beginPath();
            ctx.fillStyle = this.colour;
            // debugger;
            const canvas_x = this.position.x * ctx.canvas.width;
            const canvas_y = this.position.y * ctx.canvas.height;
            ctx.arc(canvas_x, canvas_y, this.radius, 0.3 * Math.PI, 0.7 * Math.PI, true);
            ctx.lineTo(canvas_x, canvas_y);
            ctx.closePath();
            ctx.fill();
        }
        // Draw trails
        ctx.beginPath();
        ctx.moveTo(this.trailpoints[0][0] * ctx.canvas.width, this.trailpoints[0][1] * ctx.canvas.height);
        ctx.strokeStyle = `hsl(${Math.sin(this.hue_initial + (this.velocity.x + this.velocity.y) * 32767) * 90 + 270} 100% 50%)`;
        for (const point of this.trailpoints.slice(1)) {
            ctx.lineTo(point[0] * ctx.canvas.width, point[1] * ctx.canvas.height);
        }
        ctx.stroke();
        this.trailpoints.push([this.position.x, this.position.y]);
        if (this.trailpoints.length > this.trail_length) {
            this.trailpoints.shift();
        }
    }
}

class AtomScene extends Scene2d {
    constructor(canvas, atoms) {
        super(canvas);
        this.atoms = atoms;
        this.colour_connections = this.id % 2;
        this.wiggly_trails = this.id == 2 || this.id == 1;
        // Following is very bad on performance!
        // this.ctx.shadowColor = "#fda";
        // this.ctx.shadowOffsetX = 2;
        // this.ctx.shadowBlur = 15;
    }

    render() {
        // Called by user subsequent to instantiation.   Kicks off the animation.
        // Do initial stuff to prepare for particle madness
        // using this.ctx.blah.blah...
        // ...Hmmm, nothing to do at the moment, really!
        // ...but to be future-proof, let's call super.render():  even though it does nothing atm, it might do in the future...
        super.render();
        requestAnimationFrame(this.update.bind(this));
    }

    update() {
        // debugger;
        // Called for every repaint, by requestAnimationFrame()
        super.update();
        // Here, update all the atom positions and draw them
        this.ctx.clearRect(0, 0, this.width, this.height);
        for (const atom of this.atoms) {
            // Set new position for each atom
            atom.position.x += atom.velocity.x / Math.sin(this.progress * 10) * 11;
            atom.position.y += atom.velocity.y / Math.cos(this.progress * 10) * 13;
            if (this.wiggly_trails) {
                atom.position.x += Math.random() * 0.02 - 0.01;
                atom.position.y += Math.random() * 0.02 - 0.01;
            }
            else if (!this.id) {
                // atom.position.x += Math.sin(this.progress) * 0.000000000001;
                // atom.position.y += Math.sin(this.progress) * 0.000000000001;
            }

            // Check if atom is going offscreen, and if so, bounce it back
            if (atom.position.x * this.width <= atom.radius && atom.velocity.x < 0) {
                atom.position.x = atom.radius / this.width;
                atom.velocity.x = -atom.velocity.x;
            }
            
            if (atom.position.y * this.height <= atom.radius && atom.velocity.y < 0) {
                atom.position.y = atom.radius / this.height;
                atom.velocity.y = -atom.velocity.y;
            }
            
            if (atom.position.x * this.width >= this.width - atom.radius && atom.velocity.x > 0) {
                atom.position.x = (this.width - atom.radius) / this.width;
                atom.velocity.x = -atom.velocity.x;
            }
            
            if (atom.position.y * this.height >= this.height - atom.radius && atom.velocity.y > 0) {
                atom.position.y = (this.height - atom.radius) / this.height;
                atom.velocity.y = -atom.velocity.y;
            }
        }  
        if (this.id > 1) {
            // Now check the proximity of each pair of atoms, and connect them if they are closer than the lesser of the two gravities
            for (let [atom_a, atom_b] of this.atoms.map((atom_a, i) => this.atoms.slice(i + 1).map(atom_b => [atom_a, atom_b])).flat()) {
                const proximity = Math.hypot((atom_b.position.x - atom_a.position.x) * this.width, (atom_b.position.y - atom_a.position.y) * this.height);
                if (proximity < Math.min(atom_a.gravity, atom_b.gravity)) {
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeStyle = this.colour_connections
                        ? `lch(50% 132 ${rand_int(360)} / ${Math.floor(100 - Math.min(proximity, 100))}%)`
                        : `rgb(255 255 255 / ${Math.floor(100 - Math.min(proximity, 100))}%)`;
                    this.ctx.beginPath();
                    this.ctx.moveTo(atom_a.position.x * this.width, atom_a.position.y * this.height);
                    this.ctx.lineTo(atom_b.position.x * this.width, atom_b.position.y * this.height);
                    this.ctx.stroke();
                    if (proximity <= atom_a.radius + atom_b.radius) {
                        atom_a.velocity.x *= -1;
                        atom_a.velocity.y *= -1;
                        atom_b.velocity.x *= -1;
                        atom_b.velocity.y *= -1;
                    }
                }
            }
        }
        // Finally, draw the atoms themselves      
        for (let atom of this.atoms) {
            atom.draw(this.ctx, this.id);   // pass the scene id so we can decide what to draw based on that.
        }

        requestAnimationFrame(this.update.bind(this));
    }
}

function init() {
    const scenes = [];
    const cols = Math.sqrt(canvas_count);
    const main = document.getElementById('main');
    const all_videos = [...document.querySelectorAll('video')];
    let available_videos = all_videos;
    main.innerHTML = '';
    main.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    const {width: main_width, height: main_height} = main.getBoundingClientRect();

    // Create an array of canvases and add each one to the DOM
    const canvases = Array(canvas_count).fill(0).map((_, i) => {
        const c = document.createElement('canvas');
        c.id = `canvas-${i}`;
        c.width = main_width / cols - 10;
        c.height = main_height / cols - 10;
        main.appendChild(c);
        return c;
    });

    // For each canvas, create a new Scene, and push the new Scene to an array of scenes.
    let curve, params;
    canvases.forEach((canvas, index) => {
        // if (Math.random() > 0.8) {
        //     canvas.style.filter = filters[rand_int(filters.length)];
        // }
        let s;  // will be a Scene of some subtype
        if (index < -14) {
            // Create a Curve Scene
            let amp, k, a, b, c, r, density, x_wobble_amp, y_wobble_amp, x_wobble_freq, y_wobble_freq;
            switch(index) {
                case 0:
                    curve = 'hcrr';
                    params = [Math.random() * 10, Math.random() * 4, rand_in_range(16, 32)];
                    break;
                case 5:
                case 7:
                    curve = 'wobbly_hcrr';
                    params = [Math.random() * 10, Math.random() * 6, rand_in_range(32, 48)];
                    break;
                case 1:
                    r = rand_in_range(128, 192);
                    density = rand_in_range(12, 64);
                    curve = 'spiral';
                    params = [r, density];
                    break;
                case 6:
                    r = rand_in_range(128, 192);
                    density = rand_in_range(12, 64);
                    x_wobble_amp = Math.random() * 20;
                    y_wobble_amp = Math.random() * 20;
                    x_wobble_freq = Math.random() * 20;
                    y_wobble_freq = Math.random() * 20;
                    curve = 'wobbly_spiral';
                    params = [r, density, x_wobble_amp, y_wobble_amp, x_wobble_freq, y_wobble_freq];
                    break;
                case 2:
                    curve = 'trig_grid';
                    params = [rand_in_range(3, 16), rand_in_range(3, 16)];
                    break;
                case 3:
                    k = rand_in_range(1, 13) / rand_in_range(1, 23);
                    amp = rand_in_range(150, 200);
                    curve = 'rhodonea';
                    params = [k, amp];
                    break;
                case 4:
                    a = rand_in_range(10, canvas.width / 2);
                    b = rand_in_range(2, canvas.width / 4);
                    amp = Math.random() + 0.2;
                    curve = 'hypocycloid';
                    params = [a, b, amp] ;
                    break;
                default:
                    curve = 'unknown';
                    params = [
                        rand_in_range(-100, 100), 
                        rand_in_range(-100, 100), 
                        rand_in_range(-100, 100), 
                        rand_in_range(1, 5), 
                        rand_in_range(1, 5), 
                        rand_in_range(1, 5), 
                        rand_in_range(1, 5),  
                        rand_in_range(40, canvas.width / 3)
                    ];
                    break;
                }

            s = new CurveScene(canvas, curve, params, canvas_count < 5 ? 1 : rand_in_range(1, 3));
            scenes.push(s);
        }
        else if (true) {
            // Create an Atom Scene
            let atoms = [];
            const pixel_count = canvas.width * canvas.height;
            // let atom_count = rand_in_range(pixel_count / 8192, pixel_count / 4096);
            let atom_count = 128;
            for (let i = 0; i < atom_count; i++) {
                const radius = rand_in_range(2,6);
                const colour = `lch(50% 132 ${rand_int(360)})`;
                const position = {x: Math.random(), y: Math.random()};
                const velocity = {x: Math.random() * 0.001 - 0.0005, y: Math.random() * 0.001 - 0.0005};
                const gravity = canvas.width / 2;
                const trail_length = index == 0 || index == 3 ? 96 : 2048;
                atoms.push(new Atom(
                    radius,
                    colour,
                    position,
                    velocity,
                    gravity,
                    trail_length
                ));
            }
            s = new AtomScene(canvas, atoms);
            scenes.push(s);
        }
        else {
            // Create a static scene
            s = new StaticScene(canvas);
            scenes.push(s);
        }

        if (DEBUG) {
            // test() method should draw something simple and small, just to verify canvas drawability!
            s.test();
        }
    });
    
    // Render scenes in a separate loop, as we may want this to be separate from scene creation in the future.
    for (const scene of scenes) {
        scene.render();
    }
}

// Top-level code
const DEBUG = true;
const rand_int = n => Math.floor(n * Math.random());
const rand_in_range = (m, n) => Math.floor((n - m) * Math.random() + m);
let canvas_count = 4; // must be a perfect square!
let show_curve_info = true;
const toggle_curve_info = _ => show_curve_info = !show_curve_info;
const filters = ['none', 'hue-rotate(45deg)', 'sepia(1)', 'invert(1)'];

// Allow user to hit a digit key to refresh with a different number of canvases -
// the square of the digit entered.
// So, to get 16 (4x4)canvases, hit 4, and to get 49 (7x7), hit 7!
window.addEventListener('keyup', event => {
    if (!event.ctrlKey && !event.altKey) {
        const char = event.key;
        const digit = char.match(/\d/)?.input;
        if (digit) {
            canvas_count = digit * digit;
            init();
        }
        else {
            switch(char) {
                // 
                case 'c':
                    // 'c' is standard for toggling subtitles on Youtube, so...
                    toggle_curve_info();
                    init()
                    break;
                default:
            }
        }
    }
});

['load', 'resize'].forEach(event => window.addEventListener(event, init));
