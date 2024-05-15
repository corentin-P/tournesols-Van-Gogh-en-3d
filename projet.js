import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import {dat} from './lib/dat.gui.min.js';
import {Coordinates} from './lib/Coordinates.js';

"use strict";

var camera, renderer;
var cameraControls, effectController;
var clock = new THREE.Clock();
var gridX = false;
var gridY = false;
var gridZ = false;
var axes = true;
var ground = true;
var vaseRadius = 10, vaseHeight = 40, vaseX = 0, vaseY = 0, vaseZ = 0;
var arm, forearm, vase;

function fillScene() {
	window.scene = new THREE.Scene();
	window.scene.fog = new THREE.Fog( 0x808080, 2000, 4000 );

	// LIGHTS
	var ambientLight = new THREE.AmbientLight( 0x222222 );
	var light = new THREE.DirectionalLight( 0xFFFFFF, 1.0 );
	light.position.set( 200, 400, 500 );
	var light2 = new THREE.DirectionalLight( 0xFFFFFF, 1.0 );
	light2.position.set( -500, 250, -200 );
	var light3 = new THREE.DirectionalLight( 0xFFFFFF, 1.0 );
	light3.position.set( -100, 50, -200 );
	var light4 = new THREE.DirectionalLight( 0xFFFFFF, 1.0 );
	light4.position.set( 0, -200, -100 );
	window.scene.add(ambientLight);
	window.scene.add(light);
	window.scene.add(light2);
	window.scene.add(light3);
	window.scene.add(light4);

	// vase definitions
	var vaseUpMaterial = new THREE.MeshPhongMaterial({color: 0XC4B029, specular: 0XC4B029, shininess: 80});
	var vaseDownMaterial = new THREE.MeshLambertMaterial({color: 0xCCC486, specular: 0xCCC486, shininess: 80});

	//var torus = new THREE.Mesh(
	//	new THREE.TorusGeometry( 22, 15, 32, 32 ), robotBaseMaterial );
	//torus.rotation.x = 90 * Math.PI/180;
	//window.scene.add( torus );

	//forearm = new THREE.Object3D();
	//var faLength = 80;

	//createRobotExtender( forearm, faLength, robotForearmMaterial );

	//arm = new THREE.Object3D();
	//var uaLength = 120;

	//createRobotCrane( arm, uaLength, robotUpperArmMaterial );
    //arm.position.y = 50;
	// Move the forearm itself to the end of the upper arm.
	//forearm.position.y = uaLength;
	//arm.add( forearm );
	//window.scene.add( arm );

	// creates the vase 
	vase = new THREE.Object3D();
	// Add vase geometries into vase variable
	createVase(vase, vaseDownMaterial, vaseUpMaterial, vaseRadius, vaseHeight);
	
	// creates x sunflowers
	let nbSunFlowers = 8;
	let nbFloorSunFlowers = 3;
	let ySunFlower = 0;
	for (let i = 0; i < nbFloorSunFlowers; i++) {
		ySunFlower += 5;
		for (let j = 0; j < nbSunFlowers; j++) {
			let random = Math.random() / 25;
			console.log(random);
			let sunFlowerSize = (0.40 + random * (i + 1)) * vaseHeight / 40;
			let angle = (Math.PI / (nbSunFlowers / 2)) * j + (Math.PI / (nbSunFlowers)) * i;
			createSunFlower(vase, sunFlowerSize, angle, ySunFlower);
		}
	}

	

	vase.translateX(vaseX);
	vase.translateY(vaseY);
	vase.translateZ(vaseZ);
	// ALSO CHECK OUT GUI CONTROLS FOR BODY
	// IN THE FUNCTIONS setupGUI() and render()
    window.scene.add(vase);
	window.scene.background = new THREE.CubeTextureLoader()
    	.setPath( 'textures/skybox2/' )
    	.load(['skybox_1.jpg', 'skybox_2.jpg',
			'skybox_up.jpg', 'skybox_down.jpg',
			'skybox_3.jpg', 'skybox_4.jpg']);
	
	
}

async function createSunFlower(vase, size, angle, y) {
	var loader = new OBJLoader();
	var textureLoader = new THREE.TextureLoader();
	var [obj, texture] = await Promise.all([
		loader.loadAsync('textures/sunFlower/sunFlowerStructure.obj'),
		textureLoader.loadAsync('textures/sunFlower/sunFlowerMap.jpg')]);

	obj.traverse( function ( flower ) {
		if (flower.isMesh) {
			flower.material.map = texture;
			flower.geometry.computeVertexNormals();
			flower.rotation.x = -Math.PI/2 + Math.PI/12;
			flower.scale.setScalar(size);
		}
	});
	// new 3D object for the flower to rotate it
	let flower = new THREE.Object3D();
	flower.add(obj);
	flower.position.y = y;
	flower.rotation.y = angle;

	vase.add(flower);
}

function createRobotExtender( part, length, material )
{
	var cylinder = new THREE.Mesh(
		new THREE.CylinderGeometry( 22, 22, 6, 32 ), material );
	part.add( cylinder );

	var i;
	for ( i = 0; i < 4; i++ )
	{
		var box = new THREE.Mesh(
			new THREE.BoxGeometry( 4, length, 4 ), material );
		box.position.x = (i < 2) ? -8 : 8;
		box.position.y = length/2;
		box.position.z = (i%2) ? -8 : 8;
		part.add( box );
	}

	cylinder = new THREE.Mesh(
		new THREE.CylinderGeometry( 15, 15, 40, 32 ), material );
	cylinder.rotation.x = 90 * Math.PI/180;
	cylinder.position.y = length;
	part.add( cylinder );
}

function createRobotCrane( part, length, material )
{
	var box = new THREE.Mesh(
		new THREE.BoxGeometry( 18, length, 18 ), material );
	box.position.y = length/2;
	part.add( box );

	var sphere = new THREE.Mesh(
		new THREE.SphereGeometry( 20, 32, 16 ), material );
	// place sphere at end of arm
	sphere.position.y = length;
	part.add( sphere );
}

function createVase(vase, downMaterial, upMaterial, radius, height)
{
	// bottom of the vase
	var cylinder = new THREE.Mesh(
		new THREE.CylinderGeometry(radius * 2, radius, height/2, 18), downMaterial);
	cylinder.position.y = height/4;
	vase.add(cylinder);

	// top of the vase
	cylinder = new THREE.Mesh(
		new THREE.CylinderGeometry( radius * 1.2, radius * 2, height/2, 18 ), upMaterial);
	cylinder.position.y = 3 * height/4;
	vase.add(cylinder);

}

function init() {
	var canvasWidth = 846;
	var canvasHeight = 494;
	// For grading the window is fixed in size; here's general code:
	//var canvasWidth = window.innerWidth;
	//var canvasHeight = window.innerHeight;
	var canvasRatio = canvasWidth / canvasHeight;

	// RENDERER
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.gammaInput = true;
	renderer.gammaOutput = true;
	renderer.setSize(canvasWidth, canvasHeight);
	renderer.setClearColor( 0xAAAAAA, 1.0 );

	// CAMERA
	camera = new THREE.PerspectiveCamera( 38, canvasRatio, 1, 10000 );
	
	// CONTROLS
	cameraControls = new OrbitControls(camera, renderer.domElement);
	camera.position.set(-200, 100, 20);
	cameraControls.target.set(-13, 50, 2);
	fillScene();
}

function addToDOM() {
	var container = document.getElementById('webGL');
	var canvas = container.getElementsByTagName('canvas');
	if (canvas.length>0) {
		container.removeChild(canvas[0]);
	}
	container.appendChild( renderer.domElement );
}

// draw the axis
function drawHelpers() {
	if (ground) {
		Coordinates.drawGround({size:10000});
	}
	if (gridX) {
		Coordinates.drawGrid({size:10000,scale:0.01});
	}
	if (gridY) {
		Coordinates.drawGrid({size:10000,scale:0.01, orientation:"y"});
	}
	if (gridZ) {
		Coordinates.drawGrid({size:10000,scale:0.01, orientation:"z"});
	}
	if (axes) {
		Coordinates.drawAllAxes({axisLength:200,axisRadius:1,axisTess:50});
	}
}

function animate() {
	window.requestAnimationFrame(animate);
	render();
}

function render() {
	var delta = clock.getDelta();
	cameraControls.update(delta);

	if ( 
		effectController.newGridX !== gridX || 
		effectController.newGridY !== gridY || 
		effectController.newGridZ !== gridZ || 
		effectController.newGround !== ground || 
		effectController.newAxes !== axes ||
		effectController.vx !== vaseX ||
		effectController.vy !== vaseY ||
		effectController.vz !== vaseZ
	){
		// put the new axis in vars from effectController 
		gridX = effectController.newGridX;
		gridY = effectController.newGridY;
		gridZ = effectController.newGridZ;
		ground = effectController.newGround;
		axes = effectController.newAxes;

		// put the new position of the vase in vars from effectController
		vaseX = effectController.vx;
		vaseY = effectController.vy;
		vaseZ = effectController.vz;

		fillScene();
		drawHelpers();
	}
	
	// rotation of the arms
	//body.rotation.y = effectController.by * Math.PI/180;	// yaw

	//arm.rotation.y = effectController.uy * Math.PI/180;	// yaw
	//arm.rotation.z = effectController.uz * Math.PI/180;	// roll

	//forearm.rotation.y = effectController.fy * Math.PI/180;	// yaw
	//forearm.rotation.z = effectController.fz * Math.PI/180;	// roll

	renderer.render(window.scene, camera);
}
// create the manager window in the top right corner
function setupGui() {

	effectController = {
		// for the axis
		newGridX: gridX,
		newGridY: gridY,
		newGridZ: gridZ,
		newGround: ground,
		newAxes: axes,

		// for the arms
		vx: 0.0,
		vy: 0.0,
		vz: 0.0,

	};

	var gui = new dat.GUI();
	// for the axis
	var h = gui.addFolder("Grid display");
	h.add( effectController, "newGridX").name("Show XZ grid");
	h.add( effectController, "newGridY" ).name("Show YZ grid");
	h.add( effectController, "newGridZ" ).name("Show XY grid");
	h.add( effectController, "newGround" ).name("Show ground");
	h.add( effectController, "newAxes" ).name("Show axes");
	// for the arms
	h = gui.addFolder("Vase settings");
    h.add(effectController, "vx", -20.0, 200.0, 0.5).name("x position");
	h.add(effectController, "vy", 0.0, 50.0, 0.5).name("y position");
	h.add(effectController, "vz", -100.0, 100.0, 0.5).name("z position");
}


try {
	setupGui();
	init();
	fillScene();
	drawHelpers();
	addToDOM();
	animate();
} catch(e) {
	var errorReport = "Your program encountered an unrecoverable error, can not draw on canvas. Error was:<br/><br/>";
	$('#webGL').append(errorReport+e);
}

