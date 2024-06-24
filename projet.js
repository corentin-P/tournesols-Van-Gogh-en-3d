import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { dat } from './lib/dat.gui.min.js';
import { Coordinates } from './lib/Coordinates.js';


"use strict";

var camera, renderer;
var cameraControls, effectController;
var clock = new THREE.Clock();
var gridX = false;
var gridY = false;
var gridZ = false;
var axes = false;
var ground = false;
var vaseRadius = 10, vaseHeight = 40, vaseX = 0, vaseRotation = 0, vaseZ = 0, butterflyPosition = 0, butterflyDirection = 1;
var vase, mirror, mirrorCamera, butterfly;
var butterflyTexture1, butterflyTexture2;
var shadowCameraSize = 70;
var fogParams = {
	density: 0.001,
	color: 0xffffff
};

function fillScene() {
	window.scene = new THREE.Scene();
	window.scene.fog = new THREE.FogExp2(fogParams.color, fogParams.density);

	// LIGHTS
	var ambientLight = new THREE.AmbientLight( 0x222222 );
	var light = new THREE.DirectionalLight( 0xFFFFFF, 1.0 );
	light.position.set( 200, 200, 300 );

	var light2 = new THREE.DirectionalLight( 0xFFFFFF, 1.0 );
	light2.position.set( 100, 250, -200 );
	
	var light3 = new THREE.DirectionalLight( 0xFFFFFF, 1.0 );
	light3.position.set( -300, 200, -50 );
	light3.castShadow = true;
	light3.shadow.camera.top = shadowCameraSize;
	light3.shadow.camera.left = -shadowCameraSize;
	light3.shadow.camera.right = shadowCameraSize;
	light3.shadow.camera.bottom = -shadowCameraSize;
	
	//window.scene.add(new THREE.DirectionalLightHelper(light, 10));
	//window.scene.add(new THREE.DirectionalLightHelper(light2, 10));
	//window.scene.add(new THREE.DirectionalLightHelper(light3, 10));
	window.scene.add(ambientLight);
	window.scene.add(light);
	window.scene.add(light2);
	window.scene.add(light3);

	let walls = new THREE.Object3D();
	createWalls(walls);
	window.scene.add(walls);

	// vase definitions
	var vaseUpMaterial = new THREE.MeshPhongMaterial({color: 0XC4B029, specular: 0XC4B029, shininess: 80});
	var vaseDownMaterial = new THREE.MeshLambertMaterial({color: 0xCCC486});

	// creates the vase 
	vase = new THREE.Object3D();
	// Add vase geometries into vase variable
	createVase(vase, vaseDownMaterial, vaseUpMaterial, vaseRadius, vaseHeight);
	
	createSunFlowers(vase, (0.40) * vaseHeight / 40);
	//createHeadSunFlowers(vase);
	
	// coordinates for the vase (can change with the gui)
	vase.translateX(vaseX);
	vase.rotateY(vaseRotation);
	vase.translateZ(vaseZ);
	vase.castShadow = true;
	vase.traverse( function (object) {
		if (object instanceof THREE.Mesh) {
			object.castShadow = true;
			object.receiveShadow = true;
		}
	});

    window.scene.add(vase);

	// load skybox
	window.scene.background = new THREE.CubeTextureLoader()
		.setPath( 'textures/skybox2/' )
		.load(['skybox_1.jpg', 'skybox_2.jpg',
			'skybox_up.jpg', 'skybox_down.jpg',
			'skybox_3.jpg', 'skybox_4.jpg']);
	console.log(vase);
	createButterfly();
}

async function loadObjectWithTextures(pathObj, pathText, size, xRotation) {
	var loader = new OBJLoader();
	var textureLoader = new THREE.TextureLoader();
	var [obj, texture] = await Promise.all([
		loader.loadAsync(pathObj),
		textureLoader.loadAsync(pathText),
	]);

	obj.traverse( function ( object ) {
		if (object.isMesh) {
			object.material.map = texture;
			object.geometry.computeVertexNormals();
			object.rotation.x = xRotation;
			object.scale.setScalar(size);
			object.castShadow = true;
			object.receiveShadow = true;
		}
	});
	return obj;
}

async function loadObjectWithMtl(pathObj, pathMtl, size, objectToAdd) {
	var loader = new OBJLoader();
	var mtlLoader = new MTLLoader();
	await mtlLoader.load(pathMtl, function(materials) {
		materials.preload();
		loader.setMaterials(materials);
		loader.load(pathObj, function (object) {
			object.scale.setScalar(size);
			objectToAdd.add(object);
		});
	});
	return true;
}

async function createSunFlowers(vase, size) {
	// creates x sunflowers and add it to the vase object
	let nbSunFlowers = 8;
	let nbFloorSunFlowers = 3;
	let ySunFlower = 0;

	let obj = loadObjectWithTextures('textures/sunFlower/sunFlowerStructure.obj', 'textures/sunFlower/sunFlowerMap.jpg', size, -Math.PI/2 + Math.PI/12);
	obj.then((obj) => {
		// new 3D object for the flower to rotate it
		let sunFlower = new THREE.Object3D();
		sunFlower.add(obj);
		
		for (let i = 0; i < nbFloorSunFlowers; i++) {
			ySunFlower += 5;
			for (let j = 0; j < nbSunFlowers; j++) {
				//let random = Math.random() / 25;
				let angle = (Math.PI / (nbSunFlowers / 2)) * j + (Math.PI / (nbSunFlowers)) * i;
				let copy = sunFlower.clone();
				copy.position.y = ySunFlower;
				copy.rotation.y = angle;
				copy.castShadow = true;
				vase.add(copy);
			}
		}
	})
}

async function createHeadSunFlowers(vase) {
	let headSunFlower = new THREE.Object3D();
	let headSunFlowerSize = 10;
	let yHeadSunFlower = vaseHeight + 35;
	let nbHeadSunFlowers = 5;
	let obj = loadObjectWithMtl('textures/headSunFlower/model.obj', 'textures/headSunFlower/model.mtl', headSunFlowerSize, headSunFlower);
	obj.then(() => {
		// creates x head of sunflowers and add it to the vase object
		let angle = (2 * Math.PI)/(nbHeadSunFlowers);
		for (let i = 0; i < nbHeadSunFlowers; i++) {
			let copy = headSunFlower.clone();
			copy.position.x = Math.sin(angle * i) * 8;
			copy.position.y = yHeadSunFlower;
			copy.position.z = Math.cos(angle * i) * 8;
			copy.rotation.x = Math.PI;
			vase.add(copy);
		}
	})
}

function createWalls(walls) {
	// Create mirror
	const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(512, {
		generateMipmaps: true,
		minFilter: THREE.LinearMipmapLinearFilter
	});
	mirrorCamera = new THREE.CubeCamera(0.1, 5000, cubeRenderTarget);

	let mirrorGeometry = new THREE.BoxGeometry(1, 100, 100);
	let mirrorMaterial = new THREE.MeshBasicMaterial({
		envMap: mirrorCamera.renderTarget.texture,
		reflectivity: 1,
	});
	
	mirror = new THREE.Mesh(mirrorGeometry, mirrorMaterial);
	mirror.position.set(149, 75, 0);  // Adjust position as needed
	walls.add(mirror);
	
	// geometries + materials for walls and window
	let backWallGeometry = new THREE.BoxGeometry(10, 181, 350);
	let bottomWallGeometry = new THREE.BoxGeometry(200, 10, 350);
	let rightWallGeometry = new THREE.BoxGeometry(204, 181, 10);
	let bigLeftWallGeometry = new THREE.BoxGeometry(70, 181, 10);
	let smallLeftWallGeometry = new THREE.BoxGeometry(70, 53, 10);
	let windowOutlineGeometry = new THREE.BoxGeometry(3, 75, 1);
	let windowOutlineGeometry1 = new THREE.BoxGeometry(70, 3, 1);
	let windowGeometry = new THREE.BoxGeometry(70, 75, 5);
	let blueWallTexture = new THREE.TextureLoader().load('textures/blue_wall.jpg');
	let blueWallMaterial = new THREE.MeshBasicMaterial( {map: blueWallTexture} );
	let orangeWallMaterial = new THREE.MeshStandardMaterial({color: 0Xdccd36});
	let windowMaterial = new THREE.MeshBasicMaterial({color: 0x000000, transparent: true, opacity: 0.2});
	let windowOutlineMaterial = new THREE.MeshLambertMaterial({color: 0xb07b00});

	// create back wall 
	let backWall = new THREE.Mesh(backWallGeometry, blueWallMaterial);
	backWall.position.set(160, 80, 0);
	backWall.castShadow = true;
	walls.add(backWall);
	
	// create left wall
	let leftWall1 = new THREE.Mesh(bigLeftWallGeometry, blueWallMaterial);
	leftWall1.position.set(130, 80, -175);
	walls.add(leftWall1);
	let leftWall2 = new THREE.Mesh(bigLeftWallGeometry, blueWallMaterial);
	leftWall2.position.set(-4, 80, -175);
	walls.add(leftWall2);
	let leftWall3 = new THREE.Mesh(smallLeftWallGeometry, blueWallMaterial);
	leftWall3.position.set(60, 16, -175);
	walls.add(leftWall3);
	let leftWall4 = new THREE.Mesh(smallLeftWallGeometry, blueWallMaterial);
	leftWall4.position.set(60, 144, -175);
	walls.add(leftWall4);

	// create right wall
	let rightWall = new THREE.Mesh(rightWallGeometry, blueWallMaterial);
	rightWall.position.set(63, 80, 175);
	walls.add(rightWall);
	
	// create bottom wall
	let bottomWall = new THREE.Mesh(bottomWallGeometry, orangeWallMaterial);
	bottomWall.position.set(61, -5, 0);
	bottomWall.receiveShadow = true;
	window.scene.add(bottomWall);

	// create the window 
	let frontWindow = new THREE.Mesh(windowGeometry, windowMaterial);
	frontWindow.position.set(60, 80, -175);
	walls.add(frontWindow);
	let windowOutline = new THREE.Mesh(windowOutlineGeometry, windowOutlineMaterial);
	windowOutline.position.set(60, 80, -175);
	walls.add(windowOutline);
	let windowOutline1 = new THREE.Mesh(windowOutlineGeometry1, windowOutlineMaterial);
	windowOutline1.position.set(60, 80, -175);
	walls.add(windowOutline1);

}

function createButterfly() {
	butterflyTexture1 = new THREE.TextureLoader().load('textures/butterfly/1.png');
	butterflyTexture2 = new THREE.TextureLoader().load('textures/butterfly/2.png');
	
	let butterflyMaterial = new THREE.SpriteMaterial( {map: butterflyTexture1} );
	butterfly = new THREE.Sprite(butterflyMaterial);
	butterfly.scale.set(20, 20, 1);
	butterfly.position.set(0, 50, 0);
	window.scene.add(butterfly);
}

function moveButterfly(delta) {
	if (butterflyPosition <= -20) {
		butterfly.material = new THREE.SpriteMaterial( {map: butterflyTexture1} );
		butterflyDirection = 1;
	} else if (butterflyPosition >= 20) {
		butterfly.material = new THREE.SpriteMaterial( {map: butterflyTexture2} );
		butterflyDirection = -1;
	}
	butterflyPosition += delta * butterflyDirection * 5;
	butterfly.position.z  = butterflyPosition;
	butterfly.position.x  = butterflyDirection * 20 * Math.cos(butterflyPosition/20);
	butterfly.position.y = 50 + 0.7 * Math.sin(butterflyPosition);
}


function createVase(vase, downMaterial, upMaterial, radius, height)
{
	// bottom of the vase
	var cylinder = new THREE.Mesh(
		new THREE.CylinderGeometry(radius * 2, radius, height/2, 18), downMaterial);
	cylinder.position.y = height/4;
	cylinder.receiveShadow = true;
	vase.add(cylinder);

	// top of the vase
	cylinder = new THREE.Mesh(
		new THREE.CylinderGeometry( radius * 1.2, radius * 2, height/2, 18 ), upMaterial);
	cylinder.position.y = 3 * height/4;
	cylinder.castShadow = true;
	cylinder.receiveShadow = true;
	vase.add(cylinder);

}

function init() {
	if (document.URL.split('/').pop() === "rendu.html") {
		var canvasWidth = window.innerWidth - window.innerWidth/10;
		var canvasHeight = (494/846) * (9*window.innerWidth/10);
	} else {
		var canvasWidth = 846;
		var canvasHeight = 494;
	}
	// For grading the window is fixed in size; here's general code:

	var canvasRatio = canvasWidth / canvasHeight;

	// RENDERER
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.gammaInput = true;
	renderer.gammaOutput = true;
	renderer.setSize(canvasWidth, canvasHeight);
	renderer.shadowMap.enabled = true;
	renderer.setClearColor( 0xAAAAAA, 1.0 );

	// CAMERA
	camera = new THREE.PerspectiveCamera( 38, canvasRatio, 1, 10000 );
	
	// CONTROLS
	cameraControls = new OrbitControls(camera, renderer.domElement);
	camera.position.set(-400, 175, 50);
	cameraControls.target.set(-13, 75, 2);
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
    // Update mirror camera
    mirror.visible = false;  // Hide the mirror before rendering from mirrorCamera
    mirrorCamera.position.copy(mirror.position);
    mirrorCamera.update(renderer, window.scene);
    mirror.visible = true;  // Show the mirror after updating mirrorCamera
	
	// move the butterfly
	moveButterfly(delta);

	if ( 
		effectController.newGridX !== gridX || 
		effectController.newGridY !== gridY || 
		effectController.newGridZ !== gridZ || 
		effectController.newGround !== ground || 
		effectController.newAxes !== axes ||
		effectController.vx !== vaseX ||
		effectController.rotation !== vaseRotation ||
		effectController.vz !== vaseZ ||
		effectController.fogDensity !== fogParams.density ||
		effectController.fogColor !== fogParams.color 
	){
		// put the new axis in vars from effectController 
		gridX = effectController.newGridX;
		gridY = effectController.newGridY;
		gridZ = effectController.newGridZ;
		ground = effectController.newGround;
		axes = effectController.newAxes;

		// put the new position of the vase in vars from effectController
		vaseX = effectController.vx;
		vaseRotation = effectController.rotation;
		vaseZ = effectController.vz;

		// updates the fog
		fogParams.density = effectController.fogDensity;
		fogParams.color = effectController.fogColor;

		fillScene();
		drawHelpers();
	}

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

		// for the vase
		vx: 0.0,
		rotation: 0.0,
		vz: 0.0,

		// for the fog
		fogDensity: 0.00,
		fogColor: 0XFFFFFF
	};

	var gui = new dat.GUI();
	// for the axis
	var h = gui.addFolder("Grid display");
	h.add( effectController, "newGridX").name("Show XZ grid");
	h.add( effectController, "newGridY" ).name("Show YZ grid");
	h.add( effectController, "newGridZ" ).name("Show XY grid");
	h.add( effectController, "newGround" ).name("Show ground");
	h.add( effectController, "newAxes" ).name("Show axes");
	// for the vase
	h = gui.addFolder("Vase settings");
    h.add(effectController, "vx", -20.0, 115.0, 0.5).name("x position");
	h.add(effectController, "vz", -100.0, 100.0, 0.5).name("z position");
	h.add(effectController, "rotation", -Math.PI, Math.PI, 0.1).name("rotation");
	// for the fog
	h = gui.addFolder("Fog params");
	h.add( effectController, "fogDensity", 0.00, 0.005, 0.001).name("Fog density");
	h.add( effectController, "fogColor").name("Fog color");
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

