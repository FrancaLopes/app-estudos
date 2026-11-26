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
    listaMaterias.appendChild(item