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
let materiaSelecionada = null;             // id da matéria escolhida

// =====================================================
// ELEMENTOS DA TELA
// =====================================================
const listaMaterias  = document.getElementById("lista-materias");
const textoMateria   = document.getElementById("materia-atual");
const dialogMateria  = document.getElementById("dialog-materia");
const inputNome      = document.getElementById("input-nome-materia");
const inputCor       = document.getElementById("input-cor-materia");

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
  // Não deixa trocar de matéria com uma sessão em andamento
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
  if (!confirm("Excluir esta matéria?")) return;

  materias = materias.filter(m => m.id !== id);
  salvar("materias", materias);

  if (materiaSelecionada === id) {
    materiaSelecionada = null;
    textoMateria.textContent = "Escolha uma matéria";
  }
  mostrarMaterias();
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

// Enter no campo de nome também salva
inputNome.addEventListener("keydown", function (evento) {
  if (evento.key === "Enter") salvarMateria();
});

// =====================================================
// INICIAR
// =====================================================
mostrarMaterias();
// =====================================================
// CRONÔMETRO
// =====================================================
const textoTempo = document.getElementById("tempo");
const btnStart   = document.getElementById("btn-start");
const btnPausar  = document.getElementById("btn-pausar");
const btnParar   = document.getElementById("btn-parar");

// Estado do cronômetro (salvo para não perder se a página recarregar)
// materiaId: matéria da sessão | inicio: quando apertou Start | acumulado: tempo antes de pausar
let cronometro = carregar("cronometro", { materiaId: null, inicio: null, acumulado: 0 });
let intervalo = null;

// Calcula quanto tempo já passou (em milissegundos)
function tempoDecorrido() {
  let total = cronometro.acumulado;
  if (cronometro.inicio !== null) {
    total += Date.now() - cronometro.inicio;
  }
  return total;
}

// Transforma milissegundos em "00:00:00"
function formatarTempo(ms) {
  const totalSegundos = Math.floor(ms / 1000);
  const horas    = Math.floor(totalSegundos / 3600);
  const minutos  = Math.floor((totalSegundos % 3600) / 60);
  const segundos = totalSegundos % 60;
  return [horas, minutos, segundos]
    .map(n => String(n).padStart(2, "0"))
    .join(":");
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
}

function iniciar() {
  // Começando uma sessão nova
  if (cronometro.materiaId === null) {
    cronometro.materiaId = materiaSelecionada;
    cronometro.acumulado = 0;
  }
  cronometro.inicio = Date.now();
  salvar("cronometro", cronometro);

  clearInterval(intervalo);
  intervalo = setInterval(atualizarTela, 1000); // atualiza a cada 1 segundo
  atualizarTela();
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
  const duracao = cronometro.acumulado;

  // Provisório: no passo 6 isso vira a janela de anotação
  alert("Sessão encerrada: " + formatarTempo(duracao));
  zerarCronometro();
}

function zerarCronometro() {
  cronometro = { materiaId: null, inicio: null, acumulado: 0 };
  salvar("cronometro", cronometro);
  clearInterval(intervalo);
  atualizarTela();
}

btnStart.addEventListener("click", iniciar);
btnPausar.addEventListener("click", pausar);
btnParar.addEventListener("click", parar);

// Se a página recarregou no meio de uma sessão, retoma de onde estava
if (cronometro.materiaId !== null) {
  materiaSelecionada = cronometro.materiaId;
  const materia = materias.find(m => m.id === materiaSelecionada);
  if (materia) textoMateria.textContent = materia.nome;
  mostrarMaterias();
  if (cronometro.inicio !== null) {
    intervalo = setInterval(atualizarTela, 1000);
  }
}
atualizarTela();