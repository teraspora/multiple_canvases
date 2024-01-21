// Main Javascript file for Multiple Canvases
// John Lynch - January 2024

let DEBUG = false;
        const rand_int = n => Math.floor(n * Math.random());
        const rand_in_range = (m, n) => Math.floor((n - m) * Math.random() + m);

        class Atom {
            static instance_count = 0;
            constructor(size, shape, position, velocity) {
                this.id = Atom.instance_count++;
                this.size = size;
                this.shape = shape;
                this.position = position;
                this.velocity = velocity;
            }
            draw() {

            }
        }

        class Scene {
            static instance_count = 0;
            constructor(canvas) {
                this.id = Scene.instance_count++;
                this.canvas = canvas;
                this.ctx = this.canvas.getContext("2d");
                this.width = this.canvas.width;
                this.height = this.canvas.height;
                this.progress = 0;
                this.progress_delta = 0.02;
            }
            render() {
            }
            update(t) {
                this.progress += this.progress_delta;
            }
            test() {
                // Draw something simple and small, just to verify canvas drawability!
                this.ctx.fillStyle = `hsl(${Math.random() * 360} 100% 50%)`;
                this.ctx.fillRect(8, 8, 16, 16);
            }
        }


        class CurveScene extends Scene {            
            // Curves
            static curves = {
                rhodonea: (k, amp, t) => [
                    amp * Math.cos(k * t + t) * Math.cos(t),
                    amp * Math.cos(k * t + t) * Math.sin(t),
                ],
                sine: (amp, freq, t) => [
                    amp * t,
                    amp * Math.sin(freq * t)
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
                this.hue_initial = Math.random() * 360;
            }

            render() {
                // Called by user subsequent to instantiation.   Kicks off the animation.
                const [x, y] = this.curve(...this.params, 0);
                this.x_previous = x + this.width / 2;
                this.y_previous = y + this.height / 2;
                this.ctx.font = "16px monospace"
                this.ctx.fillStyle = '#4df';
                this.ctx.shadowColor = "#fda";
                this.ctx.shadowOffsetX = 2;
                this.ctx.fillText(this.curve_name, this.width - 120, this.height - 50);
                this.ctx.fillText(`(${this.params})`, this.width - 12 * this.params.toString().length - 20, this.height - 20);
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

        class AtomScene extends Scene {
            // Jan. 20th: just set up initial structure of class
            static instance_count = 0;
            constructor(canvas, atoms) {
                super(canvas);
                this.atoms = atoms;
            }

            render() {
                // Called by user subsequent to instantiation.   Kicks off the animation.
                // Do initial stuff to prepare for particle madness
                // using this.ctx.blah.blah...
                requestAnimationFrame(this.update.bind(this));
            }

            update() {
                // Called for every repaint, by requestAnimationFrame()
                super.update();
                // Here, update all the atom positions and draw them
                requestAnimationFrame(this.update.bind(this));
            }
        }

        // Top-level code
        let canvas_count = 16; // must be a perfect square!
        init();

        // Allow user to hit a digit key to refresh with a different number of canvases -
        // the square of the digit entered.
        // So, to get 16 canvases, hit 4, and to get 49, hit 7!
        window.addEventListener('keyup', event => {
            if (!event.ctrlKey && !event.altKey) {
                const char = event.key;
                const digit = char.match(/\d/)?.input;
                if (digit) {
                    canvas_count = digit * digit;
                    init();
                }
            }
        });

        window.addEventListener('resize', init);

        function init() {
            const scenes = [];
            const cols = Math.sqrt(canvas_count);
            const main = document.getElementById('main');
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
            canvases.forEach(canvas => {
                let amp, k, a, b, c, r, density, freq, x_wobble_amp, y_wobble_amp, x_wobble_freq, y_wobble_freq;
                let i = rand_int(16);
                // i = 8;
                switch(i) {
                    case 0:
                        curve = 'hcrr';
                        params = [Math.random() * 10, Math.random() * 4, rand_in_range(16, 32)];
                        break;
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
                    case 5:
                        amp = rand_in_range(20, canvas.width / 6);
                        freq = rand_in_range(1, 12);
                        curve = 'sine';
                        params = [amp, freq];
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
                        // a = rand_in_range(30, 120);
                        // b = rand_in_range(30, 120);
                        // curve = 'ellipse';
                        // params = [a, b];
                        // break;
                    }

                const s = new CurveScene(canvas, curve, params, canvas_count < 5 ? 1 : rand_in_range(1, 3));
                // const s = new AtomScene(canvas, atoms);
                scenes.push(s);
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
