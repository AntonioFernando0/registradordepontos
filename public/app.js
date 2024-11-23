const API_URL = 'http://localhost:8080';

// Formulário para registrar ponto
document.getElementById('form-ponto').addEventListener('submit', async (e) => {
    e.preventDefault();

    const funcionario_id = document.getElementById('funcionario_id').value;
    const tipo = document.getElementById('tipo').value;

    try {
        const response = await fetch(`${API_URL}/ponto`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ funcionario_id, tipo })
        });

        if (response.ok) {
            alert('Ponto registrado com sucesso!');
            carregarRegistros(); // Atualiza a lista de registros após o ponto ser registrado
        } else {
            const error = await response.json();
            alert(error.error || 'Erro ao registrar ponto.');
        }
    } catch (err) {
        console.error('Erro:', err);
        alert('Erro ao conectar com o servidor.');
    }
});

// Função para carregar os registros de ponto
async function carregarRegistros() {
    try {
        const response = await fetch(`${API_URL}/ponto`);
        const registros = await response.json();

        const tabela = document.getElementById('registros-tabela').querySelector('tbody');
        tabela.innerHTML = ''; // Limpa a tabela antes de carregar novos registros

        // Adiciona os registros à tabela
        registros.forEach((registro) => {
            const linha = document.createElement('tr');
            linha.innerHTML = `
                <td>${registro.id}</td>
                <td>${registro.nome}</td>
                <td>${new Date(registro.data_hora).toLocaleString()}</td>
                <td>${registro.tipo}</td>
            `;
            tabela.appendChild(linha);
        });
    } catch (err) {
        console.error('Erro ao carregar registros:', err);
        alert('Erro ao carregar registros.');
    }
}

// Carrega os registros ao inicializar a página
carregarRegistros();
