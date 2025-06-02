import {sketch} from 'p5js-wrapper';

// Mouse move - expanding circles near cursor
// Left click - Ripple effect starting from cursor pos
// Right click - Spiral trails starting from cursor

// Configuration options

// Base
const CircleDiameter = 5;
const CircleGap = 20;

// Hover enlarging

const HoverRadius = 100;
const HoverMaxIncrease = 10;

// Ripple

const RippleWidth = 50;
const RippleSizeIncrease = 10;

// Trails

const TrailCount = 5;
const TrailHistoryLength = 30;

const TrailMinAngle = 0;
const TrailMaxAngle = Math.PI * 2;

const TrailMinRotationSpeed = 0.01;
const TrailMaxRotationSpeed = 0.05;

const TrailMinLinearSpeed = 5;
const TrailMaxLinearSpeed = 10;

const TrailInfluenceRadius = 40;

// Function to scale between 2 ranges using linear interpolation
// value = number to scale, minO/maxO = original range, minN/maxN = new range
function scaleBetweenRanges(value, minO, maxO, minN, maxN) {
    return (value - minO) * (maxN - minN) / (maxO - minO) + minN;
}

// While p5.js includes the dist function, it is painfully slow and was a major bottleneck
// The likely cause of the p5 implementation being slower is their (overly invasive) validation of arguments and the use of Math.hypot over Math.sqrt.
// Multiplication is used instead of exponents as it is faster for powers < ~4-5
// While it's possible that the JIT would have optimised to this anyway, it doesn't hurt performance doing it ourselves.
function distanceBetweenPoints(x1, y1, x2, y2) {
    const x = x2 - x1;
    const y = y2 - y1;
    return Math.sqrt(x * x + y * y);
}

class Ripple {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 0;
        this.maxRadius = Math.sqrt(windowWidth * windowWidth + windowHeight * windowHeight);
        // Pythagoras theorem used to get length of hypot to ensure the ripple reaches the edges of the screen
    }

    update() {
        this.radius += 10;
    }

    isDead() {
        return this.radius > this.maxRadius;
    }
}

class Trail {
    constructor(x, y) {
        this.originX = x;
        this.originY = y;
        this.angle = random(TrailMinAngle, TrailMaxAngle);
        this.radius = 0;
        this.rotationSpeed = random(TrailMinRotationSpeed, TrailMaxRotationSpeed);
        this.radiusSpeed = random(TrailMinLinearSpeed, TrailMaxLinearSpeed);
        this.history = [];
        this.maxRadius = Math.sqrt(windowWidth * windowWidth + windowHeight * windowHeight) + (this.radiusSpeed * TrailHistoryLength);
        // Pythagoras theorem used to get length of hypot to ensure the ripple reaches the edges of the screen
        // We extend the maximum slightly to allow for the trail to leave the screen
    }

    update() {
        this.radius += this.radiusSpeed;
        this.angle += this.rotationSpeed;

        let x = this.originX + this.radius * Math.cos(this.angle);
        let y = this.originY + this.radius * Math.sin(this.angle);
        this.history.push({ x, y });

        if (this.history.length > TrailHistoryLength) {
            this.history.splice(0, 1);
        }
    }

    isDead() {
        return this.radius > this.maxRadius;
    }
}

class Circle {
    x;
    y;
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    draw() {
        let diameter = CircleDiameter;
        let distance = distanceBetweenPoints(this.x, this.y, mouseX, mouseY);
        if(distance < HoverRadius) {
            diameter += scaleBetweenRanges(HoverRadius - distance, 0, HoverRadius, 0, HoverMaxIncrease);
        }

        trails.forEach((trail) => {
            // Due to the amount of calculations, performance quickly dropped even with a single trail
            // This does some cheap checks before we reach the more expensive operations to cut down on operations
            const dx = trail.originX - this.x;
            const dy = trail.originY - this.y;
            if (Math.abs(dx) > trail.radius + TrailInfluenceRadius || Math.abs(dy) > trail.radius + TrailInfluenceRadius) return;

            trail.history.forEach((pos, i) => {
                let distToPoint = distanceBetweenPoints(this.x, this.y, pos.x, pos.y);
                if (distToPoint < TrailInfluenceRadius) {
                    let strength = 5 - distToPoint / TrailInfluenceRadius;
                    let ageFactor = (i + 1) / trail.history.length;
                    diameter += strength * ageFactor;
                }
            });
        });

        ripples.forEach((ripple, i) => {
            let rippleDistance = distanceBetweenPoints(this.x, this.y, ripple.x, ripple.y);
            if (Math.abs(rippleDistance - ripple.radius) < RippleWidth) {
                let strength = 1 - Math.abs(rippleDistance - ripple.radius) / RippleWidth;
                diameter += strength * RippleSizeIncrease;
            }
        })

        // _renderEllipse is used by circle internally, by using this, we skip p5's invasive argument validation
        // Resulting in a reasonable performance improvement
        _renderEllipse(this.x, this.y, diameter);
    }
}

let circles = [];
let ripples = [];
let trails = [];

sketch.setup = function () {
    createCanvas(windowWidth, windowHeight);
    angleMode(DEGREES);
    for (let i = CircleGap; i < windowWidth; i += CircleGap) {
        for (let j = CircleGap; j < windowHeight; j += CircleGap) {
            circles.push(new Circle(i, j));
        }
    }
}

sketch.draw = function () {
    background(100);
    noStroke();
    fill(255);

    trails.forEach((trail, i, arr) => {
        trail.update();
        if (trail.isDead()) {
            arr.splice(i, 1); // Remove trail from array, GC will handle the rest of the cleanup for us
        }
    })

    ripples.forEach((ripple, i, arr) => {
        ripple.update();
        if (ripple.isDead()) {
            arr.splice(i, 1); // Remove ripple from array, GC will handle the rest of the cleanup for us
        }
    })

    circles.forEach(circle => circle.draw());
}

sketch.mousePressed = function (event) {
    if (event.button === 0) // Left click
        ripples.push(new Ripple(mouseX, mouseY));
    else if (event.button === 2) // Right click
        for (let i = 0; i < TrailCount; i++)
            trails.push(new Trail(mouseX, mouseY));
}

// We need to disable the right click context menu to allow the mousePressed event to handle right clicks properly
sketch.oncontextmenu = function (event) {
    return false;
}