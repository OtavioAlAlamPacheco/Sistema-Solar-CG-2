import {
  cameraParaPlaneta,
  arredondado,
} from './functions.js';

import {
  infoMundo,
  infoCamera,
  posicoesMercury,
  posicoesVenus,
  posicoesEarth,
  posicoesMars,
  posicoesJupiter,
  posicoesSaturn,
  posicoesMoon,
  posicoesPioneer10,
  posicoesPioneer11
} from './script.js';


let movendoParaFrente = false;
let movendoParaEsquerda = false;
let movendoParaDireita = false;
let movendoParaTras = false;
let movendoParaCima = false;
let movendoParaBaixo = false;


// de princípio estava atualizando os booleanos do 
// keydown repetidas vezes. Para não executar o có-
// digo múltiplas vezes enquanto segura, criei o
// teclasAtivas.

let teclasAtivas = {};

window.addEventListener("keydown", function(event) {
  if (!teclasAtivas[event.key]) {
    switch (event.key) {
      case "w":
        movendoParaFrente = true;
        break;
      case "a":
        movendoParaEsquerda = true;
        break;
      case "s":
        movendoParaTras = true;
        break;
      case "d":
        movendoParaDireita = true;
        break;
      case " ":
        movendoParaCima = true;
        break;
      case "Shift":
        movendoParaBaixo = true;
        break;

      case "z":
        if (infoCamera.proximoPlaneta === 0) {
          infoCamera.proximoPlaneta = 9;
        }
        else {
          infoCamera.proximoPlaneta--;
        }

        if (!infoCamera.cameraSolta) {
          cameraParaPlaneta();
        }
        break;
      
      case "x":
        if (infoCamera.proximoPlaneta === 9) {
          infoCamera.proximoPlaneta = 0;
        }
        else {
          infoCamera.proximoPlaneta++;
        }

        if (!infoCamera.cameraSolta) {
          cameraParaPlaneta();
        }
        break;

      case "c":
        infoCamera.cameraSolta = !infoCamera.cameraSolta;

        if (infoCamera.cameraSolta) {
            const dia = infoMundo.tempoPercorrido;
            const p = infoCamera.proximoPlaneta;
            let planetaPos;

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

            const target = [planetaPos.x, planetaPos.y, planetaPos.z];
            const cameraPosition = [infoCamera.x, infoCamera.y, infoCamera.z];

            // nova direção
            const dx = target[0] - cameraPosition[0];
            const dy = target[1] - cameraPosition[1];
            const dz = target[2] - cameraPosition[2];
            const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
            
            if (len > 0) {
                infoCamera.lookDir = [dx / len, dy / len, dz / len];
            }

            infoCamera.pitch = Math.asin(infoCamera.lookDir[1]);
            infoCamera.yaw = Math.atan2(infoCamera.lookDir[2], infoCamera.lookDir[0]);

            yawGraus = radianosParaGraus(infoCamera.yaw);
            pitchGraus = radianosParaGraus(infoCamera.pitch);

            const cosYaw = Math.cos(infoCamera.yaw);
            const sinYaw = Math.sin(infoCamera.yaw);

            infoCamera.leftDir = [
              arredondado(-sinYaw),
              arredondado(0),
              arredondado(cosYaw)
            ];

            infoCamera.upDir = [
              infoCamera.leftDir[1] * infoCamera.lookDir[2] - infoCamera.leftDir[2] * infoCamera.lookDir[1],
              infoCamera.leftDir[2] * infoCamera.lookDir[0] - infoCamera.leftDir[0] * infoCamera.lookDir[2],
              infoCamera.leftDir[0] * infoCamera.lookDir[1] - infoCamera.leftDir[1] * infoCamera.lookDir[0]
            ];
        }
        break;
    }

    teclasAtivas[event.key] = true;
  }
});

window.addEventListener("keyup", function(event) {
  switch (event.key) {
    case "w":
      movendoParaFrente = false;
      break;
    case "a":
      movendoParaEsquerda = false;
      break;
    case "s":
      movendoParaTras = false;
      break;
    case "d":
      movendoParaDireita = false;
      break;
    case " ":
      movendoParaCima = false;
      break;
    case "Shift":
      movendoParaBaixo = false;
      break;
  }

  teclasAtivas[event.key] = false; 
});

window.addEventListener("wheel", function(event) {

  // scroll para cima
  if (event.deltaY < 0) {
    infoCamera.velocidade++;
  }

  // scroll para baixo
  else if (infoCamera.velocidade > 0) {
    infoCamera.velocidade--;
  }
});



let arrastandoMouse = false;
let ultimoX = 0;
let ultimoY = 0;

canvas.addEventListener("mousedown", function(event) {
  if (event.button === 0) {
    arrastandoMouse = true;
    ultimoX = event.clientX;
    ultimoY = event.clientY;
  }
});

window.addEventListener("mouseup", function() {
  arrastandoMouse = false;
});

const radianosParaGraus = r => r * 180 / Math.PI;
var yawGraus = radianosParaGraus(infoCamera.yaw);       // ângulo horizontal
var pitchGraus = radianosParaGraus(infoCamera.pitch);   // ângulo vertical

canvas.addEventListener("mousemove", function(event) {
  if (!arrastandoMouse) return;

  const deltaX = event.clientX - ultimoX;
  const deltaY = event.clientY - ultimoY;

  const sensibilidade = 0.2;

  yawGraus += deltaX * sensibilidade;
  pitchGraus += -deltaY * sensibilidade;

  // Limita a rotação vertical (pitch)
  pitchGraus = Math.max(-89, Math.min(89, pitchGraus));

  ultimoX = event.clientX;
  ultimoY = event.clientY;
});



 //          Interface do HTML         \\
// - _ - _ - _ - _ - _ - _ - _ - _ - _ -\\

const timeSlider = document.getElementById('timeSlider');
const dateDisplay = document.getElementById('dateDisplay');
const playPauseBtn = document.getElementById('playPauseBtn');

timeSlider.addEventListener('input', function() {
    infoMundo.tempoPercorrido = parseInt(this.value);
    dateDisplay.textContent = `Dia ${this.value}`;
});

playPauseBtn.addEventListener('click', function() {
    infoMundo.emPausa = !infoMundo.emPausa;
    this.textContent = infoMundo.emPausa ? 'Pausar' : 'Retomar';
});



 //         Movimentação de câmera         \\
// - _ - _ - _ - _ - _ - _ - _ - _ - _ - _ -\\

setInterval(function() {

  var cameraSolta = infoCamera.cameraSolta;

  if (!cameraSolta) {
    cameraParaPlaneta();
  }
  else {
    const fator = 20;

    if (movendoParaFrente) {
      infoCamera.x += infoCamera.lookDir[0] * (fator * infoCamera.velocidade);
      infoCamera.y += infoCamera.lookDir[1] * (fator * infoCamera.velocidade);
      infoCamera.z += infoCamera.lookDir[2] * (fator * infoCamera.velocidade);
    }

    if (movendoParaEsquerda) {
      infoCamera.x -= infoCamera.leftDir[0] * (fator * infoCamera.velocidade);
      infoCamera.y -= infoCamera.leftDir[1] * (fator * infoCamera.velocidade);
      infoCamera.z -= infoCamera.leftDir[2] * (fator * infoCamera.velocidade);
    }

    if (movendoParaDireita) {
      infoCamera.x += infoCamera.leftDir[0] * (fator * infoCamera.velocidade);
      infoCamera.y += infoCamera.leftDir[1] * (fator * infoCamera.velocidade);
      infoCamera.z += infoCamera.leftDir[2] * (fator * infoCamera.velocidade);
    }

    if (movendoParaTras) {
      infoCamera.x -= infoCamera.lookDir[0] * (fator * infoCamera.velocidade);
      infoCamera.y -= infoCamera.lookDir[1] * (fator * infoCamera.velocidade);
      infoCamera.z -= infoCamera.lookDir[2] * (fator * infoCamera.velocidade);
    }

    if (movendoParaCima) {
      infoCamera.x += infoCamera.upDir[0] * (fator * infoCamera.velocidade);
      infoCamera.y += infoCamera.upDir[1] * (fator * infoCamera.velocidade);
      infoCamera.z += infoCamera.upDir[2] * (fator * infoCamera.velocidade);
    }

    if (movendoParaBaixo) {
      infoCamera.x -= infoCamera.upDir[0] * (fator * infoCamera.velocidade);
      infoCamera.y -= infoCamera.upDir[1] * (fator * infoCamera.velocidade);
      infoCamera.z -= infoCamera.upDir[2] * (fator * infoCamera.velocidade);
    }
  }


  if (arrastandoMouse) {

    const grausParaRadianos = g => g * Math.PI / 180;
    infoCamera.yaw = grausParaRadianos(yawGraus);
    infoCamera.pitch = grausParaRadianos(pitchGraus);

    const cosPitch = Math.cos(infoCamera.pitch);
    const sinPitch = Math.sin(infoCamera.pitch);
    const cosYaw = Math.cos(infoCamera.yaw);
    const sinYaw = Math.sin(infoCamera.yaw);


    infoCamera.lookDir = [
      arredondado(cosPitch * cosYaw),
      arredondado(sinPitch),
      arredondado(cosPitch * sinYaw)
    ];


    infoCamera.leftDir = [
      arredondado(-sinYaw),
      arredondado(0),
      arredondado(cosYaw)
    ];

    infoCamera.upDir = [
      infoCamera.leftDir[1] * infoCamera.lookDir[2] - infoCamera.leftDir[2] * infoCamera.lookDir[1],
      infoCamera.leftDir[2] * infoCamera.lookDir[0] - infoCamera.leftDir[0] * infoCamera.lookDir[2],
      infoCamera.leftDir[0] * infoCamera.lookDir[1] - infoCamera.leftDir[1] * infoCamera.lookDir[0]
    ];
  }

  // se tiver pausado a simulação, não vai atualizar o tempo.
  if (!infoMundo.emPausa) {
    if (infoMundo.tempoPercorrido >= infoMundo.tempoMax) {
      infoMundo.tempoPercorrido = 0;
    } else {
      infoMundo.tempoPercorrido += 1;
    }
    
    timeSlider.value = infoMundo.tempoPercorrido;
    dateDisplay.textContent = `Dia ${infoMundo.tempoPercorrido}`;
  }


  // ------ DEBUGGING -------- \\

  if (!infoCamera.cameraSolta) {
    console.log("Seguindo o planeta ", infoCamera.proximoPlaneta);
  }

}, 14); // 1000ms é 1 segundo
        // 1000 / 16 = 62.5 FPS
