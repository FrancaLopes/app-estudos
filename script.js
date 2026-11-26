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
  materiaSelecionada = id;
  const materia = materias.find(m => m.id === id);
  textoMateria.textContent = materia.nome;
  mostrarMaterias();
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