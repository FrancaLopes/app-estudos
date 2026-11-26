// =====================================================
// DADOS
// =====================================================

// Carrega dados salvos no navegador (ou usa o valor padrão)
function carregar(chave, padrao) {
  try {
    const dados = localStorage.getItem(chave);
    return dados ? JSON.parse(dados) : padrao;
  } catch {
    return padrao;
  }
}

// Salva dados no navegador
function salvar(chave, valor) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    alert("Não foi possível salvar os dados.");
  }
}

let materias = carregar("materias", []);   // lista de matérias
let sessoes  = carregar("sessoes", []);    // registros de estudo
let materiaSelecionada = null;             // id da matéria escolhida

// Estado do cronômetro (salvo para não perder se a página recarregar)
// materiaId: matéria da sessão | inicio: quando apertou Start
// acumulado: tempo antes de pausar | nota: anotações da sessão
let cronometro = carregar("cronometro", { materiaId: null, inicio: null, acumulado: 0, nota: "" });
let intervalo = null;

// =====================================================
// ELEMENTOS DA TELA
// =====================================================
const listaMaterias = document.getElementById("lista-materias");
const textoMateria  = document.getElementById("materia-atual");
const dialogMateria = document.getElementById("dialog-materia");
const inputNome     = document.getElementById("input-nome-materia");
const inputCor      = document.getElementById("input-cor-materia");

const textoTempo    = document.getElementById("tempo");
const btnStart      = document.getElementById("btn-start");
const btnPausar     = document.getElementById("btn-pausar");
const btnParar      = document.getElementById("btn-parar");
const inputAnotacao = document.getElementById("input-anotacao");

const dialogTempo   = document.getElementById("dialog-anotacao");
const textoResumo   = document.getElementById("resumo-sessao");
const textoFinal    = document.getElementById("tempo-final");
const btnCorrigir   = document.getElementById("btn-corrigir");
const inputTempo    = document.getElementById("input-tempo");

// =====================================================
// MATÉRIAS
// =====================================================

// Desenha a lista de matérias na tela
function mostrarMaterias() {
  listaMaterias.innerHTML = "";

  if (materias.length === 0) {
    listaMaterias.innerHTML = '<li class="vazio">Nenhuma matéria ainda. Toque em "+ Matéria".</li>';
    return;
  }

  materias.forEach(function (materia) {
    const item = document.createElement("li");
    item.className = "materia";
    if (materia.id === materiaSelecionada) {
      item.classList.add("selecionada");
    }

    const bolinha = document.createElement("span");
    bolinha.className = "bolinha";
    bolinha.style.background = materia.cor;

    const nome = document.createElement("span");
    nome.className = "nome";
    nome.textContent = materia.nome;

    const btnExcluir = document.createElement("button");
    btnExcluir.className = "btn-excluir";
    btnExcluir.textContent = "✕";
    btnExcluir.addEventListener("click", function (evento) {
      evento.stopPropagation(); // não seleciona a matéria ao excluir
      excluirMateria(materia.id);
    });

    item.addEventListener("click", function () {
      selecionarMateria(materia.id);
    });

    item.append(bolinha, nome, btnExcluir);
    listaMaterias.appendChild(item);
  });
}

// Escolhe a matéria que vai ser estudada
function selecionarMateria(id) {
  if (cronometro.materiaId !== null) {
    alert("Pare a sessão atual antes de trocar de matéria.");
    return;
  }
  materiaSelecionada = id;
  const materia = materias.find(m => m.id === id);
  textoMateria.textContent = materia.nome;
  mostrarMaterias();
  atualizarTela();
}

// Cria uma nova matéria
function salvarMateria() {
  const nome = inputNome.value.trim();
  if (nome === "") {
    alert("Digite o nome da matéria.");
    return;
  }

  materias.push({
    id: Date.now().toString(), // número único baseado no horário
    nome: nome,
    cor: inputCor.value
  });

  salvar("materias", materias);
  dialogMateria.close();
  mostrarMaterias();
}

// Exclui uma matéria
function excluirMateria(id) {
  if (cronometro.materiaId === id) {
    alert("Pare a sessão desta matéria antes de excluir.");
    return;
  }
  if (!confirm("Excluir esta matéria?")) return;

  materias = materias.filter(m => m.id !== id);
  salvar("materias", materias);

  if (materiaSelecionada === id) {
    materiaSelecionada = null;
    textoMateria.textContent = "Escolha uma matéria";
  }
  mostrarMaterias();
  atualizarTela();
}

// =====================================================
// TEMPO (funções de ajuda)
// =====================================================

// Milissegundos → "00:00:00" (para o relógio)
function formatarTempo(ms) {
  const totalSegundos = Math.floor(ms / 1000);
  const horas    = Math.floor(totalSegundos / 3600);
  const minutos  = Math.floor((totalSegundos % 3600) / 60);
  const segundos = totalSegundos % 60;
  return [horas, minutos, segundos]
    .map(n => String(n).padStart(2, "0"))
    .join(":");
}

// Milissegundos → "1h 25min" (para mostrar ao parar)
function formatarDuracao(ms) {
  const totalMinutos = Math.round(ms / 60000);
  const horas   = Math.floor(totalMinutos / 60);
  const minutos = totalMinutos % 60;

  if (totalMinutos === 0) return "menos de 1 min";
  if (horas === 0) return minutos + " min";
  if (minutos === 0) return horas + "h";
  return horas + "h " + minutos + "min";
}

// Milissegundos → "1:30" (para o campo de correção)
function formatarHM(ms) {
  const totalMinutos = Math.round(ms / 60000);
  const horas   = Math.floor(totalMinutos / 60);
  const minutos = totalMinutos % 60;
  return horas + ":" + String(minutos).padStart(2, "0");
}

// "1:30" ou "90" → milissegundos
function lerTempo(texto) {
  texto = texto.trim();
  let horas = 0;
  let minutos = 0;

  if (texto.includes(":")) {
    const partes = texto.split(":");
    horas   = parseInt(partes[0]) || 0;
    minutos = parseInt(partes[1]) || 0;
  } else {
    minutos = parseInt(texto) || 0;
  }
  return (horas * 60 + minutos) * 60000;
}

// =====================================================
// CRONÔMETRO
// =====================================================

// Calcula quanto tempo já passou (em milissegundos)
function tempoDecorrido() {
  let total = cronometro.acumulado;
  if (cronometro.inicio !== null) {
    total += Date.now() - cronometro.inicio;
  }
  return total;
}

// Atualiza o relógio e liga/desliga os botões
function atualizarTela() {
  textoTempo.textContent = formatarTempo(tempoDecorrido());

  const rodando  = cronometro.inicio !== null;
  const emSessao = cronometro.materiaId !== null;

  btnStart.disabled  = rodando || (!emSessao && materiaSelecionada === null);
  btnPausar.disabled = !rodando;
  btnParar.disabled  = !emSessao;
  btnStart.textContent = (emSessao && !rodando) ? "Continuar" : "Start";

  // Anotações só liberadas durante a sessão
  inputAnotacao.disabled = !emSessao;
  inputAnotacao.placeholder = emSessao
    ? "Anotações da aula (salvas automaticamente)"
    : "Dê Start para fazer anotações";
}

function iniciar() {
  // Começando uma sessão nova
  if (cronometro.materiaId === null) {
    cronometro.materiaId = materiaSelecionada;
    cronometro.acumulado = 0;
    cronometro.nota = "";
    inputAnotacao.value = "";
  }
  cronometro.inicio = Date.now();
  salvar("cronometro", cronometro);

  clearInterval(intervalo);
  intervalo = setInterval(atualizarTela, 1000); // atualiza a cada 1 segundo
  atualizarTela();
  inputAnotacao.focus();
}

function pausar() {
  cronometro.acumulado = tempoDecorrido();
  cronometro.inicio = null;
  salvar("cronometro", cronometro);
  clearInterval(intervalo);
  atualizarTela();
}

function parar() {
  if (cronometro.inicio !== null) pausar();
  const materia = materias.find(m => m.id === cronometro.materiaId);

  textoResumo.textContent = materia ? materia.nome : "Matéria";
  textoFinal.textContent  = formatarDuracao(cronometro.acumulado);

  // Campo de correção começa escondido
  inputTempo.value   = formatarHM(cronometro.acumulado);
  inputTempo.hidden  = true;
  btnCorrigir.hidden = false;

  dialogTempo.showModal();
}

function zerarCronometro() {
  cronometro = { materiaId: null, inicio: null, acumulado: 0, nota: "" };
  salvar("cronometro", cronometro);
  inputAnotacao.value = "";
  clearInterval(intervalo);
  atualizarTela();
}

// Salva a anotação a cada letra digitada
inputAnotacao.addEventListener("input", function () {
  cronometro.nota = inputAnotacao.value;
  salvar("cronometro", cronometro);
});

// =====================================================
// SESSÕES (registros de estudo)
// =====================================================
function salvarSessao() {
  // Se corrigiu, usa o valor digitado; senão, usa o tempo do cronômetro
  const duracao = inputTempo.hidden ? cronometro.acumulado : lerTempo(inputTempo.value);

  if (duracao < 60000) {
    alert("Menos de 1 minuto. Corrija o tempo ou use Descartar.");
    return;
  }

  const materia = materias.find(m => m.id === cronometro.materiaId);

  sessoes.push({
    id: Date.now().toString(),
    materiaId: cronometro.materiaId,
    materiaNome: materia ? materia.nome : "(matéria excluída)",
    cor: materia ? materia.cor : "#94a3b8",
    duracao: duracao,
    data: Date.now(),
    nota: (cronometro.nota || "").trim()
  });

  salvar("sessoes", sessoes);
  dialogTempo.close();
  zerarCronometro();
}

function descartarSessao() {
  if (!confirm("Descartar esta sessão? O tempo e as anotações não serão registrados.")) return;
  dialogTempo.close();
  zerarCronometro();
}

// =====================================================
// BOTÕES
// =====================================================
document.getElementById("btn-nova-materia").addEventListener("click", function () {
  inputNome.value = "";
  dialogMateria.showModal();
  inputNome.focus();
});

document.getElementById("btn-cancelar-materia").addEventListener("click", function () {
  dialogMateria.close();
});

document.getElementById("btn-salvar-materia").addEventListener("click", salvarMateria);

inputNome.addEventListener("keydown", function (evento) {
  if (evento.key === "Enter") salvarMateria();
});

btnStart.addEventListener("click", iniciar);
btnPausar.addEventListener("click", pausar);
btnParar.addEventListener("click", parar);

btnCorrigir.addEventListener("click", function () {
  inputTempo.hidden  = false;
  btnCorrigir.hidden = true;
  inputTempo.focus();
  inputTempo.select();
});

document.getElementById("btn-salvar-sessao").addEventListener("click", salvarSessao);
document.getElementById("btn-descartar-sessao").addEventListener("click", descartarSessao);

inputTempo.addEventListener("keydown", function (evento) {
  if (evento.key === "Enter") salvarSessao();
});

// =====================================================
// INICIAR
// =====================================================

// Se a página recarregou no meio de uma sessão, retoma de onde estava
if (cronometro.materiaId !== null) {
  materiaSelecionada = cronometro.materiaId;
  const materia = materias.find(m => m.id === materiaSelecionada);
  if (materia) textoMateria.textContent = materia.nome;
  inputAnotacao.value = cronometro.nota || "";
  if (cronometro.inicio !== null) {
    intervalo = setInterval(atualizarTela, 1000);
  }
}

mostrarMaterias();
atualizarTela();