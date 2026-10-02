const CONFIG_PARTIDO = {
    nome: "PMarvel",
    numero: "92"
};

const LIMITES_CARGOS = {
    "Presidente": 1,
    "Governador(a)": 1,
    "Senador(a)": 2,
    "Deputado(a) Federal": Infinity,
    "Deputado(a) Estadual": Infinity
};

const candidatos = [];

const registroCandidaturas = [];

document.addEventListener("DOMContentLoaded", () => {
    configurarInterface();
    carregarCandidatos();
});

function configurarInterface() {
    document.getElementById("txtNumeroPartido").addEventListener("change", processarPartido);
    document.getElementById("lstCandidatos").addEventListener("change", selecionarCandidato);
    document.getElementById("btnRegistrar").addEventListener("click", registrarCandidatura);
    document.getElementById("btnEnviar").addEventListener("click", gravarEEnviarTSE);
    document.getElementById("lstCargos").addEventListener("change", limparMensagens);
    document.getElementById("txtNumeroCandidato").addEventListener("input", limparErroNumero);

    processarPartido();
}

function limparMensagens() {
    document.getElementById("msgErroNumero").textContent = "";
    document.getElementById("msgFeedbackAcao").textContent = "";
    document.getElementById("msgFeedbackAcao").className = "";
}

function limparErroNumero() {
    document.getElementById("msgErroNumero").textContent = "";
}

async function processarPartido() {
    const numeroPartido = document.getElementById("txtNumeroPartido").value.trim();
    const msgErro = document.getElementById("msgErroPartido");

    if (numeroPartido !== CONFIG_PARTIDO.numero) {
        msgErro.textContent = "Número de partido inválido para esta aplicação. Informe 92 (PMarvel).";
        document.getElementById("lblNomePartido").innerHTML = "<b>---</b>";
        limparListaCandidatos();
        return;
    }

    msgErro.textContent = "";
    document.getElementById("lblNomePartido").innerHTML = `<b>${CONFIG_PARTIDO.nome}</b>`;

    try {
        await carregarCandidatos();
    } catch (erro) {
        msgErro.textContent = "Não foi possível carregar os filiados. Verifique o arquivo candidatos.json.";
        console.error(erro);
    }
}

async function carregarCandidatos() {
    const resposta = await fetch("candidatos.json", { cache: "no-store" });

    if (!resposta.ok) {
        throw new Error(`Erro HTTP ao carregar candidatos.json: ${resposta.status}`);
    }

    const dados = await resposta.json();

    if (!Array.isArray(dados[CONFIG_PARTIDO.nome])) {
        throw new Error(`O partido ${CONFIG_PARTIDO.nome} não foi encontrado em candidatos.json.`);
    }

    candidatos.length = 0;
    dados[CONFIG_PARTIDO.nome].forEach((candidato) => {
        candidatos.push({
            nome: candidato.nome,
            foto: candidato.foto,
            cargo: "",
            numero: ""
        });
    });

    popularListaCandidatos();
}

function popularListaCandidatos() {
    const lista = document.getElementById("lstCandidatos");
    lista.innerHTML = '<option value="">Selecione um filiado</option>';

    candidatos.forEach((candidato, indice) => {
        const option = document.createElement("option");
        option.value = String(indice);
        option.textContent = candidato.nome;
        lista.appendChild(option);
    });
}

function limparListaCandidatos() {
    const lista = document.getElementById("lstCandidatos");
    lista.innerHTML = '<option value="">Nenhum filiado carregado</option>';
    document.getElementById("painelCandidato").hidden = true;
}

function selecionarCandidato() {
    const indice = document.getElementById("lstCandidatos").value;
    const painel = document.getElementById("painelCandidato");

    if (indice === "") {
        painel.hidden = true;
        return;
    }

    const candidato = candidatos[Number(indice)];

    if (!candidato) {
        painel.hidden = true;
        return;
    }

    document.getElementById("infoNome").textContent = candidato.nome;
    document.getElementById("infoFoto").src = candidato.foto;
    document.getElementById("infoFoto").alt = `Foto de ${candidato.nome}`;
    document.getElementById("txtNumeroCandidato").value = "";
    document.getElementById("lstCargos").value = "";
    document.getElementById("msgErroNumero").textContent = "";
    painel.hidden = false;

    const registro = registroCandidaturas.find((item) => item.nome === candidato.nome);
    if (registro) {
        document.getElementById("lstCargos").value = registro.cargo;
        document.getElementById("txtNumeroCandidato").value = registro.numero;
    }
}

function obterCandidatoSelecionado() {
    const indice = document.getElementById("lstCandidatos").value;
    if (indice === "") return null;
    return candidatos[Number(indice)] || null;
}

function validarNumeroCandidato(numero, cargo) {
    const numeroNormalizado = String(numero).trim();
    const prefixo = CONFIG_PARTIDO.numero;

    const digitosPorCargo = {
        "Presidente": 2,
        "Governador(a)": 2,
        "Senador(a)": 3,
        "Deputado(a) Federal": 4,
        "Deputado(a) Estadual": 5
    };

    if (!Object.prototype.hasOwnProperty.call(digitosPorCargo, cargo)) {
        return "Selecione um cargo válido.";
    }

    if (!/^\d+$/.test(numeroNormalizado)) {
        return "O número do candidato deve conter somente dígitos.";
    }

    if (!numeroNormalizado.startsWith(prefixo)) {
        return `O número deve começar com ${prefixo}, que é o número do PMarvel.`;
    }

    const tamanhoEsperado = digitosPorCargo[cargo];

    if (numeroNormalizado.length !== tamanhoEsperado) {
        return `Para ${cargo}, o número deve ter ${tamanhoEsperado} dígitos.`;
    }

    return "";
}

function contarCandidaturasPorCargo(cargo) {
    return registroCandidaturas.filter((item) => item.cargo === cargo).length;
}

function registrarCandidatura() {
    limparMensagens();

    const candidato = obterCandidatoSelecionado();
    const cargo = document.getElementById("lstCargos").value;
    const numero = document.getElementById("txtNumeroCandidato").value.trim();
    const msgNumero = document.getElementById("msgErroNumero");
    const feedback = document.getElementById("msgFeedbackAcao");

    if (!candidato) {
        feedback.textContent = "Selecione um filiado.";
        feedback.className = "erro";
        return;
    }

    if (!cargo) {
        feedback.textContent = "Selecione o cargo que o filiado irá disputar.";
        feedback.className = "erro";
        return;
    }

    const erroNumero = validarNumeroCandidato(numero, cargo);
    if (erroNumero) {
        msgNumero.textContent = erroNumero;
        return;
    }

    const candidatoJaRegistrado = registroCandidaturas.find(
        (item) => item.nome === candidato.nome
    );

    if (candidatoJaRegistrado) {
        feedback.textContent =
            `${candidato.nome} já foi indicado para ${candidatoJaRegistrado.cargo}. ` +
            "O mesmo candidato não pode disputar mais de um cargo.";
        feedback.className = "erro";
        return;
    }

    const numeroJaUsado = registroCandidaturas.some(
        (item) => item.numero === numero
    );

    if (numeroJaUsado) {
        msgNumero.textContent = "Este número de candidato já foi utilizado na chapa.";
        return;
    }

    const limite = LIMITES_CARGOS[cargo];
    const quantidadeAtual = contarCandidaturasPorCargo(cargo);

    if (quantidadeAtual >= limite) {
        feedback.textContent =
            `O limite de ${limite} candidatura(s) para ${cargo} já foi atingido.`;
        feedback.className = "erro";
        return;
    }

    const registro = {
        nome: candidato.nome,
        numero,
        foto: candidato.foto,
        cargo
    };

    registroCandidaturas.push(registro);

    candidato.cargo = cargo;
    candidato.numero = numero;

    atualizarListaRegistrados();

    feedback.textContent = `Candidatura de ${candidato.nome} registrada com sucesso.`;
    feedback.className = "sucesso";

    document.getElementById("lstCandidatos").value = "";
    document.getElementById("lstCargos").value = "";
    document.getElementById("txtNumeroCandidato").value = "";
    document.getElementById("painelCandidato").hidden = true;
}

function atualizarListaRegistrados() {
    const lista = document.getElementById("listaRegistrados");
    lista.innerHTML = "";

    if (registroCandidaturas.length === 0) {
        lista.innerHTML = '<li class="vazio">Nenhuma candidatura registrada.</li>';
        return;
    }

    registroCandidaturas.forEach((candidatura) => {
        const item = document.createElement("li");
        item.className = "registro-item";
        item.innerHTML = `
            <div>
                <strong>${candidatura.nome}</strong>
                <span>${candidatura.cargo}</span>
                <small>Número: ${candidatura.numero}</small>
            </div>
        `;
        lista.appendChild(item);
    });
}

function gravarEEnviarTSE() {
    const feedback = document.getElementById("msgFeedbackAcao");

    if (registroCandidaturas.length === 0) {
        feedback.textContent = "Registre pelo menos uma candidatura antes de enviar a chapa.";
        feedback.className = "erro";
        return;
    }

    const chapaFinal = registroCandidaturas.map((candidato) => ({
        nome: candidato.nome,
        numero: candidato.numero,
        foto: candidato.foto,
        cargo: candidato.cargo
    }));

    const payload = JSON.stringify(chapaFinal, null, 2);

    localStorage.setItem("PMarvel_chapa", payload);

    const blob = new Blob([payload], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "PMarvel.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    feedback.textContent =
        "Chapa validada, gravada e arquivo PMarvel.json gerado para envio ao TSE.";
    feedback.className = "sucesso";
}
