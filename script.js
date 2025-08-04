"use strict";

var vsPlanets = `#version 300 es
in vec4 a_position;
uniform mat4 u_matrix;
out vec4 v_color;

void main() {
  gl_Position = u_matrix * a_position;
  v_color = vec4(1.0, 1.0, 1.0, 1.0);
}
`;

var fsPlanets = `#version 300 es
precision highp float;
in vec4 v_color;
uniform vec4 u_colorMult;
uniform vec4 u_colorOffset;
out vec4 outColor;

void main() {
  outColor = v_color * u_colorMult + u_colorOffset;
}
`;

var vsOrbit = `#version 300 es
in vec4 a_position;
uniform mat4 u_matrix;

void main() {
  gl_Position = u_matrix * a_position;
}
`;

var fsOrbit = `#version 300 es
precision highp float;
uniform vec4 u_color;
out vec4 outColor;

void main() {
  outColor = u_color;
}
`;

// fonte para o shader do Sol: https://sangillee.com/2024-06-29-create-realistic-sun-with-shaders

var vsSun = `#version 300 es
in vec4 a_position;
in vec3 a_normal;

uniform mat4 u_matrix;
uniform mat4 u_world;

out vec3 v_normal;
out vec3 v_worldPosition;

void main() {
  gl_Position = u_matrix * a_position;
  v_worldPosition = (u_world * a_position).xyz;
  v_normal = mat3(u_world) * a_normal;
}
`;

var fsSun = `#version 300 es
precision highp float;

uniform float u_time;
uniform vec3 u_cameraPosition;

in vec3 v_normal;
in vec3 v_worldPosition;

out vec4 outColor;

float random(vec3 st) {
    return fract(sin(dot(st.xyz, vec3(12.9898, 78.233, 45.5432))) * 43758.5453123);
}

float noise(vec3 st) {
    vec3 i = floor(st);
    vec3 f = fract(st);

    float a = random(i);
    float b = random(i + vec3(1.0, 0.0, 0.0));
    float c = random(i + vec3(0.0, 1.0, 0.0));
    float d = random(i + vec3(1.0, 1.0, 0.0));
    float e = random(i + vec3(0.0, 0.0, 1.0));
    float f_ = random(i + vec3(1.0, 0.0, 1.0));
    float g = random(i + vec3(0.0, 1.0, 1.0));
    float h = random(i + vec3(1.0, 1.0, 1.0));

    vec3 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) +
           (c - a) * u.y * (1.0 - u.x) +
           (d - b) * u.y * u.x +
           (e - a) * u.z * (1.0 - u.y) * (1.0 - u.x) +
           (f_ - b) * u.z * (1.0 - u.y) * u.x +
           (g - c) * u.z * u.y * (1.0 - u.x) +
           (h - d) * u.z * u.y * u.x;
}

// Fractal Brownian Motion
float fbm(vec3 st) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 0.0;
    for (int i = 0; i < 6; i++) {
        value += amplitude * noise(st);
        st *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

void main() {
    vec3 noisy_pos = v_worldPosition * 0.01 + vec3(u_time * 0.05);
    float fbm_noise = fbm(noisy_pos);

    vec3 base_color = vec3(1.0, 0.5, 0.0) * (fbm_noise + 0.5);
    vec3 final_color = base_color;

    vec3 view_dir = normalize(u_cameraPosition - v_worldPosition);
    vec3 normal = normalize(v_normal);
    float fresnel = 1.0 - dot(view_dir, normal);
    fresnel = pow(fresnel, 2.0); // Potência para controlar a intensidade do brilho

    final_color += vec3(1.0, 0.8, 0.2) * fresnel;

    outColor = vec4(final_color, 1.0);
}
`;


var Node = function() {
  this.children = [];
  this.localMatrix = m4.identity();
  this.worldMatrix = m4.identity();
};

Node.prototype.setParent = function(parent) {
  if (this.parent) {
    var ndx = this.parent.children.indexOf(this);
    if (ndx >= 0) {
      this.parent.children.splice(ndx, 1);
    }
  }
  if (parent) {
    parent.children.push(this);
  }
  this.parent = parent;
};

Node.prototype.updateWorldMatrix = function(matrix) {
  if (matrix) {
    m4.multiply(matrix, this.localMatrix, this.worldMatrix);
  } else {
    m4.copy(this.localMatrix, this.worldMatrix);
  }
  var worldMatrix = this.worldMatrix;
  this.children.forEach(function(child) {
    child.updateWorldMatrix(worldMatrix);
  });
};




import {
  carregarArquivo,
  cameraParaPlaneta,
  arredondado,
} from './functions.js';


 //            Objetos importantes          \\
// - _ - _ - _ - _ - _ - _ - _ - _ - _ - _ - \\

export var infoMundo = {
  tempoPercorrido: 0,
  tempoMax: 10747,
  escala: 0.0001,
  emPausa: true,
}

export var infoCamera = {
  x: 0,
  y: 0,
  z: 150000,
  velocidade: 20,
  leftDir: [1, 0, 0],
  upDir: [0, 1, 0],
  yaw: -Math.PI / 2,
  pitch: 0,
  lookDir: [0, 0, -1],
  cameraSolta: true,
  proximoPlaneta: 0,
};


 //               Coordenadas dos astros                \\
// - _ - _ - _ - _ - _ - _ - _ - _ - _ - _ - _ - _ - _ - \\

export let posicoesMercury = await carregarArquivo("Planets/Mercury.txt");
export let posicoesVenus = await carregarArquivo("Planets/Venus.txt");
export let posicoesEarth = await carregarArquivo("Planets/Earth.txt");
export let posicoesMars = await carregarArquivo("Planets/Mars.txt");
export let posicoesJupiter = await carregarArquivo("Planets/Jupiter.txt");
export let posicoesSaturn = await carregarArquivo("Planets/Saturn.txt");
export let posicoesMoon = await carregarArquivo("Planets/Moon.txt");

export let posicoesPioneer10 = await carregarArquivo("Others/Pioneer_10.txt");
export let posicoesPioneer11 = await carregarArquivo("Others/Pioneer_11.txt");


 //              Período orbital dos astros             \\
// - _ - _ - _ - _ - _ - _ - _ - _ - _ - _ - _ - _ - _ - \\

let periodoMercury = 88;
let periodoVenus = 225;
let periodoEarth = 365;
let periodoMoon = 27;
let periodoMars = 687;
let periodoJupiter = 4331;
let periodoSaturn = 10747;

export let size = [];



async function main() {

  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  var canvas = document.querySelector("#canvas");
  var gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }

  // Tell the twgl to match position with a_position, n
  // normal with a_normal etc..
  twgl.setAttributePrefix("a_");

  // setup GLSL program
  var planetProgramInfo = twgl.createProgramInfo(gl, [vsPlanets, fsPlanets]);
  var orbitProgramInfo = twgl.createProgramInfo(gl, [vsOrbit, fsOrbit]);
  var sunProgramInfo = twgl.createProgramInfo(gl, [vsSun, fsSun]);

  if (!planetProgramInfo || !orbitProgramInfo || !sunProgramInfo) {
      console.error("Falha ao compilar um ou mais programas de shader.");
      return;
  }
  
  var sphereBufferInfo = flattenedPrimitives.createSphereBufferInfo(gl, 10, 24, 12); 
  var sphereVAO = twgl.createVAOFromBufferInfo(gl, planetProgramInfo, sphereBufferInfo);
  var sunVAO = twgl.createVAOFromBufferInfo(gl, sunProgramInfo, sphereBufferInfo);

  function degToRad(d) {
    return d * Math.PI / 180;
  }

  var fieldOfViewRadians = degToRad(60);


 //               Tamanho dos astros                \\
// - _ - _ - _ - _ - _ - _ - _ - _ - _ - _ - _ - _ - \\

  var escala = infoMundo.escala;
  var minSize = 0.002 / escala; 
  var sunSize = 1392700 * escala;
  var mercurySize = Math.max(4879 * escala, minSize);
  var venusSize = Math.max(12104 * escala, minSize);
  var earthSize = Math.max(12756 * escala, minSize);
  var marsSize = Math.max(6792 * escala, minSize);
  var jupiterSize = Math.max(142984 * escala, minSize);
  var saturnSize = Math.max(120536 * escala, minSize);
  var moonSize = Math.max(3475 * escala, minSize);

  var pioneer10Size = minSize;
  var pioneer11Size = minSize;

  size.push(sunSize, mercurySize, venusSize, earthSize, moonSize, marsSize, jupiterSize, saturnSize, pioneer10Size, pioneer11Size);



 //               Definindo os Nodes                \\
// - _ - _ - _ - _ - _ - _ - _ - _ - _ - _ - _ - _ - \\

  var solarSystemNode = new Node();

  var sunNode = new Node();
  sunNode.localMatrix = m4.scaling(sunSize, sunSize, sunSize);
  sunNode.drawInfo = {
    uniforms: { 
      u_time: 0,
      u_cameraPosition: [0,0,0],
      u_world: m4.identity()
    },
    programInfo: sunProgramInfo, 
    bufferInfo: sphereBufferInfo, 
    vertexArray: sunVAO,
  };

  var mercuryOrbitNode = new Node();
  var mercuryNode = new Node();
  mercuryNode.localMatrix = m4.scaling(mercurySize, mercurySize, mercurySize);
  mercuryNode.drawInfo = {
    uniforms: { u_colorOffset: [0.6, 0.6, 0.6, 1], u_colorMult: [0.1, 0.1, 0.1, 1] },
    programInfo: planetProgramInfo, bufferInfo: sphereBufferInfo, vertexArray: sphereVAO,
  };

  var venusOrbitNode = new Node();
  var venusNode = new Node();
  venusNode.localMatrix = m4.scaling(venusSize, venusSize, venusSize);
  venusNode.drawInfo = {
    uniforms: { u_colorOffset: [0.8, 0.6, 0.4, 1], u_colorMult: [0.2, 0.2, 0.2, 1] },
    programInfo: planetProgramInfo, bufferInfo: sphereBufferInfo, vertexArray: sphereVAO,
  };

  var earthOrbitNode = new Node();
  var earthNode = new Node();
  earthNode.localMatrix = m4.scaling(earthSize, earthSize, earthSize);
  earthNode.drawInfo = {
    uniforms: { u_colorOffset: [0.2, 0.6, 0.0, 0.2], u_colorMult: [0.3, 0.5, 0.2, 1] },
    programInfo: planetProgramInfo, bufferInfo: sphereBufferInfo, vertexArray: sphereVAO,
  };
  
  var marsOrbitNode = new Node();
  var marsNode = new Node();
  marsNode.localMatrix = m4.scaling(marsSize, marsSize, marsSize);
  marsNode.drawInfo = {
    uniforms: { u_colorOffset: [1, 0.2, 0.3, 1], u_colorMult: [0.1, 0.5, 0.2, 1] },
    programInfo: planetProgramInfo, bufferInfo: sphereBufferInfo, vertexArray: sphereVAO,
  };

  var jupiterOrbitNode = new Node();
  var jupiterNode = new Node();
  jupiterNode.localMatrix = m4.scaling(jupiterSize, jupiterSize, jupiterSize);
  jupiterNode.drawInfo = {
    uniforms: { u_colorOffset: [0.8, 0.5, 0.2, 1], u_colorMult: [0.2, 0.2, 0.2, 1] },
    programInfo: planetProgramInfo, bufferInfo: sphereBufferInfo, vertexArray: sphereVAO,
  };

  var saturnOrbitNode = new Node();
  var saturnNode = new Node();
  saturnNode.localMatrix = m4.scaling(saturnSize, saturnSize, saturnSize);
  saturnNode.drawInfo = {
    uniforms: { u_colorOffset: [0.8, 0.6, 0.4, 1], u_colorMult: [0.2, 0.2, 0.2, 1] },
    programInfo: planetProgramInfo, bufferInfo: sphereBufferInfo, vertexArray: sphereVAO,
  };

  var moonOrbitNode = new Node();
  var moonNode = new Node();
  moonNode.localMatrix = m4.scaling(moonSize, moonSize, moonSize);
  moonNode.drawInfo = {
    uniforms: { u_colorOffset: [0.6, 0.6, 0.6, 1], u_colorMult: [0.1, 0.1, 0.1, 1] },
    programInfo: planetProgramInfo, bufferInfo: sphereBufferInfo, vertexArray: sphereVAO,
  };

  var pioneer10OrbitNode = new Node();
  var pioneer10Node = new Node();
  pioneer10Node.localMatrix = m4.scaling(pioneer10Size, pioneer10Size, pioneer10Size);
  pioneer10Node.drawInfo = {
    uniforms: { u_colorOffset: [0.9, 0.9, 0.8, 1], u_colorMult: [0.1, 0.1, 0.1, 1] },
    programInfo: planetProgramInfo, bufferInfo: sphereBufferInfo, vertexArray: sphereVAO,
  };

  var pioneer11OrbitNode = new Node();
  var pioneer11Node = new Node();
  pioneer11Node.localMatrix = m4.scaling(pioneer11Size, pioneer11Size, pioneer11Size);
  pioneer11Node.drawInfo = {
    uniforms: { u_colorOffset: [0.9, 0.9, 0.8, 1], u_colorMult: [0.1, 0.1, 0.1, 1] },
    programInfo: planetProgramInfo, bufferInfo: sphereBufferInfo, vertexArray: sphereVAO,
  };


 //               SetParent                 \\
// - _ - _ - _ - _ - _ - _ - _ - _ - _ - _ - \\

  sunNode.setParent(solarSystemNode);
  
  mercuryOrbitNode.setParent(solarSystemNode);
  mercuryNode.setParent(mercuryOrbitNode);

  venusOrbitNode.setParent(solarSystemNode);
  venusNode.setParent(venusOrbitNode);

  earthOrbitNode.setParent(solarSystemNode);
  earthNode.setParent(earthOrbitNode);

  marsOrbitNode.setParent(solarSystemNode);
  marsNode.setParent(marsOrbitNode);
  
  jupiterOrbitNode.setParent(solarSystemNode);
  jupiterNode.setParent(jupiterOrbitNode);

  saturnOrbitNode.setParent(solarSystemNode);
  saturnNode.setParent(saturnOrbitNode);

  moonOrbitNode.setParent(solarSystemNode); 
  moonNode.setParent(moonOrbitNode);

  pioneer10OrbitNode.setParent(solarSystemNode);
  pioneer10Node.setParent(pioneer10OrbitNode);

  pioneer11OrbitNode.setParent(solarSystemNode);
  pioneer11Node.setParent(pioneer11OrbitNode);



   //           Lista de objetos (planetas)           \\
  // - _ - _ - _ - _ - _ - _ - _ - _ - _ - _ - _ - _ - \\

  var objects = [
    sunNode, mercuryNode, venusNode, earthNode, marsNode, jupiterNode, saturnNode, moonNode, pioneer10Node, pioneer11Node,
  ];
  var objectsToDraw = objects.map(obj => obj.drawInfo);



   //        Lista de objetos e buffers (órbitas)         \\
  // - _ - _ - _ - _ - _ - _ - _ - _ - _ - _ - _ - _ - _ - \\

  const orbitDrawInfos = [];
  const planetOrbitData = [
      { name: "Mercury", positions: posicoesMercury, color: [0.7, 0.7, 0.7, 1] },
      { name: "Venus",   positions: posicoesVenus,   color: [0.8, 0.6, 0.4, 1] },
      { name: "Earth",   positions: posicoesEarth,   color: [0.4, 0.6, 0.8, 1] },
      { name: "Mars",    positions: posicoesMars,    color: [1.0, 0.4, 0.3, 1] },
      { name: "Jupiter", positions: posicoesJupiter, color: [0.8, 0.7, 0.6, 1] },
      { name: "Saturn",  positions: posicoesSaturn,  color: [0.9, 0.8, 0.6, 1] },
      { name: "Moon",    positions: posicoesMoon,    color: [0.6, 0.6, 0.6, 1] },
      { name: "Pioneer10", positions: posicoesPioneer10, color: [0.9, 0.9, 0.8, 1] },
      { name: "Pioneer11", positions: posicoesPioneer11, color: [0.9, 0.9, 0.8, 1] },
  ];

  for (const planetData of planetOrbitData) {
      const positions = [];
      for (const pos of planetData.positions) {
          positions.push(pos.x, pos.y, pos.z);
      }
      const positionArray = new Float32Array(positions);

      const arrays = {
        position: { numComponents: 3, data: positionArray },
      };

      const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);
      const vao = twgl.createVAOFromBufferInfo(gl, orbitProgramInfo, bufferInfo);

      orbitDrawInfos.push({
          vertexArray: vao,
          bufferInfo: bufferInfo,
          uniforms: {
              u_matrix: m4.identity(),
              u_color: planetData.color,
          },
      });
  }

  

   //              drawScene              \\
  // - _ - _ - _ - _ - _ - _ - _ - _ - _ - \\


  function drawScene(time) {

     //           Configurações iniciais            \\
    // - _ - _ - _ - _ - _ - _ - _ - _ - _ - _ - _ - \\

    twgl.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


    //               Matriz de projeção             \\
    // - _ - _ - _ - _ - _ - _ - _ - _ - _ - _ - _ - \\

    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 1;
    const zFar = 6000000;
    var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);


    //               Matriz da câmera               \\
    // - _ - _ - _ - _ - _ - _ - _ - _ - _ - _ - _ - \\

    var cameraPosition = [infoCamera.x, infoCamera.y, infoCamera.z];
    var target;
    if (infoCamera.cameraSolta) {
      target = [
        cameraPosition[0] + infoCamera.lookDir[0],
        cameraPosition[1] + infoCamera.lookDir[1],
        cameraPosition[2] + infoCamera.lookDir[2]
      ];
    } else {
      const dia = infoMundo.tempoPercorrido;
      var p = infoCamera.proximoPlaneta;
      var planetaPos;
      switch (p) {
        case 0: planetaPos = { x: 0, y: 0, z: 0 }; break;
        case 1: planetaPos = posicoesMercury[dia % posicoesMercury.length]; break;
        case 2: planetaPos = posicoesVenus[dia % posicoesVenus.length]; break;
        case 3: planetaPos = posicoesEarth[dia % posicoesEarth.length]; break;
        case 4: planetaPos = posicoesMoon[dia % posicoesMoon.length]; break;
        case 5: planetaPos = posicoesMars[dia % posicoesMars.length]; break;
        case 6: planetaPos = posicoesJupiter[dia % posicoesJupiter.length]; break;
        case 7: planetaPos = posicoesSaturn[dia % posicoesSaturn.length]; break;
        case 8: planetaPos = posicoesPioneer10[dia % posicoesPioneer10.length]; break;
        case 9: planetaPos = posicoesPioneer11[dia % posicoesPioneer11.length]; break;
      }
      target = [planetaPos.x, planetaPos.y, planetaPos.z];
    }
    var cameraMatrix = m4.lookAt(cameraPosition, target, infoCamera.upDir);
    var viewMatrix = m4.inverse(cameraMatrix);
    var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);



    //          Atualizando matriz dos objetos            \\
    // - _ - _ - _ - _ - _ - _ - _ - _ - _ - _ - _ - - _ - \\
    
    var dia = infoMundo.tempoPercorrido;

    // nós de cada órbita
    mercuryOrbitNode.localMatrix = m4.translation(posicoesMercury[dia % posicoesMercury.length].x, posicoesMercury[dia % posicoesMercury.length].y, posicoesMercury[dia % posicoesMercury.length].z);
    venusOrbitNode.localMatrix = m4.translation(posicoesVenus[dia % posicoesVenus.length].x, posicoesVenus[dia % posicoesVenus.length].y, posicoesVenus[dia % posicoesVenus.length].z);
    earthOrbitNode.localMatrix = m4.translation(posicoesEarth[dia % posicoesEarth.length].x, posicoesEarth[dia % posicoesEarth.length].y, posicoesEarth[dia % posicoesEarth.length].z);
    marsOrbitNode.localMatrix = m4.translation(posicoesMars[dia % posicoesMars.length].x, posicoesMars[dia % posicoesMars.length].y, posicoesMars[dia % posicoesMars.length].z);
    jupiterOrbitNode.localMatrix = m4.translation(posicoesJupiter[dia % posicoesJupiter.length].x, posicoesJupiter[dia % posicoesJupiter.length].y, posicoesJupiter[dia % posicoesJupiter.length].z);
    saturnOrbitNode.localMatrix = m4.translation(posicoesSaturn[dia % posicoesSaturn.length].x, posicoesSaturn[dia % posicoesSaturn.length].y, posicoesSaturn[dia % posicoesSaturn.length].z);
    moonOrbitNode.localMatrix = m4.translation(posicoesMoon[dia % posicoesMoon.length].x, posicoesMoon[dia % posicoesMoon.length].y, posicoesMoon[dia % posicoesMoon.length].z);
    pioneer10OrbitNode.localMatrix = m4.translation(posicoesPioneer10[dia % posicoesPioneer10.length].x, posicoesPioneer10[dia % posicoesPioneer10.length].y, posicoesPioneer10[dia % posicoesPioneer10.length].z);
    pioneer11OrbitNode.localMatrix = m4.translation(posicoesPioneer11[dia % posicoesPioneer11.length].x, posicoesPioneer11[dia % posicoesPioneer11.length].y, posicoesPioneer11[dia % posicoesPioneer11.length].z);

    // rotação
    m4.multiply(m4.yRotation(0.005), sunNode.localMatrix, sunNode.localMatrix);
    m4.multiply(m4.yRotation(0.05), earthNode.localMatrix, earthNode.localMatrix);
    m4.multiply(m4.yRotation(0.05), marsNode.localMatrix, marsNode.localMatrix);
    m4.multiply(m4.yRotation(0.02), mercuryNode.localMatrix, mercuryNode.localMatrix);
    m4.multiply(m4.yRotation(0.02), venusNode.localMatrix, venusNode.localMatrix);
    m4.multiply(m4.yRotation(0.01), jupiterNode.localMatrix, jupiterNode.localMatrix);
    m4.multiply(m4.yRotation(0.01), saturnNode.localMatrix, saturnNode.localMatrix);
    m4.multiply(m4.yRotation(-0.01), moonNode.localMatrix, moonNode.localMatrix);

    // atualiza todas as matrizes do mundo na árvore da cena
    solarSystemNode.updateWorldMatrix();

    // calcula a matriz final pra cada objeto a ser desenhado
    objects.forEach(function(object) {
      object.drawInfo.uniforms.u_matrix = m4.multiply(viewProjectionMatrix, object.worldMatrix);

      if (object === sunNode) {
          object.drawInfo.uniforms.u_world = object.worldMatrix;
          object.drawInfo.uniforms.u_time = time * 0.1;
          object.drawInfo.uniforms.u_cameraPosition = cameraPosition;
      }
    });

    
     //            Desenha os planetas              \\
    // - _ - _ - _ - _ - _ - _ - _ - _ - _ - _ - _ - \\

    twgl.drawObjectList(gl, objectsToDraw);


     //            Desenha as órbitas               \\
    // - _ - _ - _ - _ - _ - _ - _ - _ - _ - _ - _ - \\

    gl.useProgram(orbitProgramInfo.program);

    orbitDrawInfos.forEach(drawInfo => {
      gl.bindVertexArray(drawInfo.vertexArray);
      
      twgl.setUniforms(orbitProgramInfo, {
        u_matrix: viewProjectionMatrix,
        u_color: drawInfo.uniforms.u_color,
      });

      twgl.drawBufferInfo(gl, drawInfo.bufferInfo, gl.LINE_STRIP);
    });


    requestAnimationFrame(drawScene);


     //             Debug               \\
    // - _ - _ - _ - _ - _ - _ - _ - _ - \\

    var dia = infoMundo.tempoPercorrido;

    if (false) {
      console.log("LookDir: ", infoCamera.lookDir);
      console.log("UpDir: ", infoCamera.upDir);
      console.log("LeftDir: ", infoCamera.leftDir);
    }

    if (true) {
      console.log("Dia atual: ", infoMundo.tempoPercorrido);
    }
    
    if (false) {
      console.log("Dia (", dia, ") - coord Lua: ", posicoesMoon[dia]);
      console.log("Dia (", dia, ") - coord Terra: ", posicoesEarth[dia]);
    }

  }

  // essa é a primeira chamada para drawScene. Depois, ela fica em loop
  // durante toda a execução.
  requestAnimationFrame(drawScene);
}

main();
