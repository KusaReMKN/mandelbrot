'use strict';
const canvas = document.createElement('canvas');
const img = document.createElement('img');
const disp = img;
const ctx = canvas.getContext('2d');
let width = 512, height = 512;
let checkmax = 100;
let xrange = 4, yrange = 4;
let xcenter = 0, ycenter = 0;

const xdisp = () => disp.width, ydisp = () => disp.height;
const xmin = () => -xrange / 2 + xcenter, ymin = () => -yrange / 2 + ycenter;

const iter = document.getElementById('iter');
const size = document.getElementById('size');
const draw = document.getElementById('draw');
const save = document.getElementById('save');
const time = document.getElementById('time');
const prog = document.getElementById('prog');
const info = document.getElementById('info');

updateMinMax();
document.getElementById('canvas').appendChild(disp);

draw.addEventListener('click', () => Mandelbrot());
save.addEventListener('click', () => {
	const a = document.createElement('a');
	a.href = img.src;
	a.target = '_blank';
	a.download = `${Date.now()}.png`;
	a.click();
});
iter.addEventListener('change', () => checkmax = +iter.value);
size.addEventListener('change', () => width = height = +size.value);
disp.addEventListener('click', e => {
	if (draw.disabled === true) {
		ControlFree();
		return;
	}
	xcenter = (e.offsetX / xdisp() - .5) * xrange + xcenter;
	ycenter = (e.offsetY / ydisp() - .5) * yrange + ycenter;
	xrange /= 2; yrange /= 2;
	window.location.hash = GeneratePositionHash();
	Mandelbrot();
});
disp.addEventListener('contextmenu', e => {
	e.preventDefault();
	if (draw.disabled === true) return;
	xrange *= 2; yrange *= 2;
	window.location.hash = GeneratePositionHash();
	Mandelbrot();
});


function updateMinMax()
{
	[canvas.width, canvas.height] = [width, height];
}

function Power2(r, i)
{
	return [(r + i) * (r - i), r * i * 2];	// (r^2 - i^2, ri2)
}

function Absolute(r, i)
{
	return Math.hypot(r, i);
}

function CheckDivergence(r, i)
{
	const cr = r, ci = i;
	for (let n = 0; n < checkmax; n++) {
		if (Absolute(r, i) > 2) return n;
		[r, i] = Power2(r, i);
		r += cr; i += ci;
	}
	return -1;
}

async function Mandelbrot2(k)
{
	const xk = 2 ** k, yk = 2 ** k;
	for (let i = 0; i < height; i += yk) {
		for (let j = 0; j < width; j += xk) {
			const x = j / width * xrange + xmin();
			const y = i / height * yrange + ymin();
			let n;
			if (draw.disabled === false) return;	// 描画キャンセル
			if ((n = CheckDivergence(x, y)) !== -1) {
				const deg = 360 * Math.log1p(n) / Math.log1p(checkmax);
				ctx.fillStyle = `hsl(0, 0%, ${100 * (n+1)**0.5 / checkmax**0.5}%)`;
			} else {
				ctx.fillStyle = 'black';
			}
			ctx.fillRect(j, i, xk, yk);
			if (k === 0) prog.value = (i * height + j) / (height * width);
		}
		if (i % 7 === 0) await new Promise(r => setTimeout(() => r()));
	}
	img.src = canvas.toDataURL();
}

function ControlLock()
{
	draw.disabled = iter.disabled = size.disabled = save.disabled = true;
}

function ControlFree()
{
	draw.disabled = iter.disabled = size.disabled = save.disabled = false;
}

async function Mandelbrot()
{
	const start = window.performance.now();
	time.textContent = 'Drawing ... ';
	updateMinMax();
	ControlLock();
	const promise = [];
	info.textContent = `x: ${xcenter}\ny: ${ycenter}\nr: ${xrange}`;
	for (let i = Math.floor(Math.log2(width)); i >= 0 && draw.disabled === true; i--) {
		promise.push(Mandelbrot2(i));
		await new Promise(r => setTimeout(() => r()));
	}
	await Promise.all(promise);
	time.textContent += `Done. (${Math.floor(window.performance.now() - start)} [ms])`;
	ControlFree();
}

function GetQuery() {
	return window.location.hash.substring(1).split('/');
}

function GeneratePositionHash() {
	return `${xcenter}/${ycenter}/${xrange}/${checkmax}`;
}

const queries = GetQuery();
if (queries.length === 4) {
	xcenter = +queries[0];
	ycenter = +queries[1];
	xrange = yrange = +queries[2];
	iter.value = checkmax = +queries[3];
}

Mandelbrot();
