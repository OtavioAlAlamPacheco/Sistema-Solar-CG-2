import {
  infoMundo,
  infoCamera,
  size,
  posicoesMercury,
  posicoesVenus,
  posicoesEarth,
  posicoesMars,
  posicoesJupiter,
  posicoesSaturn,
  posicoesMoon,
  posicoesPioneer10,
  posicoesPioneer11,
} from './script.js';



export async function carregarArquivo(nomeArquivo) {
  try {
    const resposta = await fetch(nomeArquivo);
    const texto = await resposta.text();
    const linhas = texto.trim().split("\n");

    // ignora a primeira linha, que é a descrição das colunas
    const linhasDados = linhas.slice(1);

    const orbitas = linhasDados.map(linha => {
      const partes = linha.trim().split(/\s+/); // divide por espaços múltiplos

      const ano = parseInt(partes[0]);
      const dia = parseInt(partes[1]);
      const hora = parseInt(partes[2]);

      var x = AUparaKM(parseFloat(partes[3]));
      var y = AUparaKM(parseFloat(partes[4]));
      var z = AUparaKM(parseFloat(partes[5]));

      x = x * infoMundo.escala;
      y = y * infoMundo.escala;
      z = z * infoMundo.escala;

      return { ano, dia, hora, x, y, z };
    });

    return orbitas;

  } catch (erro) {
    console.error("Erro ao carregar arquivo:", erro);
    return [];
  }
}


export function AUparaKM(valorAU) {
  const km = 149597870.7; // 1 UA = 149.597.870,7 km
  const conversao = valorAU * km;
  return conversao;
}



export function cameraParaPlaneta() {

  const i = infoCamera.proximoPlaneta;
  const sizePlaneta = size[i];
  const dia = infoMundo.tempoPercorrido;
  var x, y, z;

  // define um deslocamento da câmera em relação ao planeta que está seguindo
  const offsetX = 100 * sizePlaneta;
  const offsetY = 0;
  const offsetZ = 1000.36 * sizePlaneta;

  switch (i) {

    // sun
    case 0:
      x = 0 + offsetX;
      y = 0 + offsetY;
      z = 0 + offsetZ;
      break;

    // mercury
    case 1:
      x = posicoesMercury[dia % posicoesMercury.length].x + offsetX;
      y = posicoesMercury[dia % posicoesMercury.length].y + offsetY;
      z = posicoesMercury[dia % posicoesMercury.length].z + offsetZ;
      break;

    // venus
    case 2:
      x = posicoesVenus[dia % posicoesVenus.length].x + offsetX;
      y = posicoesVenus[dia % posicoesVenus.length].y + offsetY;
      z = posicoesVenus[dia % posicoesVenus.length].z + offsetZ;
      break;

    // earth
    case 3:
      x = posicoesEarth[dia % posicoesEarth.length].x + offsetX;
      y = posicoesEarth[dia % posicoesEarth.length].y + offsetY;
      z = posicoesEarth[dia % posicoesEarth.length].z + offsetZ;
      break;

    // moon
    case 4:
      x = posicoesMoon[dia % posicoesMoon.length].x + offsetX;
      y = posicoesMoon[dia % posicoesMoon.length].y + offsetY;
      z = posicoesMoon[dia % posicoesMoon.length].z + offsetZ;
      break;

    // mars
    case 5:
      x = posicoesMars[dia % posicoesMars.length].x + offsetX;
      y = posicoesMars[dia % posicoesMars.length].y + offsetY;
      z = posicoesMars[dia % posicoesMars.length].z + offsetZ;
      break;

    // jupiter
    case 6:
      x = posicoesJupiter[dia % posicoesJupiter.length].x + offsetX;
      y = posicoesJupiter[dia % posicoesJupiter.length].y + offsetY;
      z = posicoesJupiter[dia % posicoesJupiter.length].z + offsetZ;
      break;

    // saturn
    case 7:
      x = posicoesSaturn[dia % posicoesSaturn.length].x + offsetX;
      y = posicoesSaturn[dia % posicoesSaturn.length].y + offsetY;
      z = posicoesSaturn[dia % posicoesSaturn.length].z + offsetZ;
      break;

    // pioneer 10
    case 8:
      x = posicoesPioneer10[dia % posicoesPioneer10.length].x + offsetX;
      y = posicoesPioneer10[dia % posicoesPioneer10.length].y + offsetY;
      z = posicoesPioneer10[dia % posicoesPioneer10.length].z + offsetZ;
      break;

    // pioneer 11
    case 9:
      x = posicoesPioneer11[dia % posicoesPioneer11.length].x + offsetX;
      y = posicoesPioneer11[dia % posicoesPioneer11.length].y + offsetY;
      z = posicoesPioneer11[dia % posicoesPioneer11.length].z + offsetZ;
      break;
  }

  infoCamera.x = x;
  infoCamera.y = y;
  infoCamera.z = z;
}




// isso aqui é uma gambiarra... no momento que eu clicava no canvas,
// estava mexendo no valor do lookDir. Depois de muito investigar,
// cheguei nessa gambiarra, que parece não trazer problemas pro código.
export function arredondado(valor) {
  const fator = Math.pow(10, 6);
  return Math.round(valor * fator) / fator;
}
