const API_URL = 'http://localhost:8080/';

// Função para carregar registros
async function carregarRegistros() {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/dados-protegidos`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
            const dados = await response.json();
            console.log(dados);
            // Aqui você pode atualizar a tabela com os dados recebidos
        } else {
            alert('Acesso negado. Faça login novamente.');
            logout(); // Logout se o acesso for negado
        }
    } catch (err) {
        console.error('Erro:', err);
    }
}

// Função para registrar ponto
document.getElementById('form-ponto').addEventListener('submit', async (e) => {
    e.preventDefault();

    const funcionario_id = document.getElementById('funcionario_id').value;
    const tipo = document.getElementById('tipo').value;
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/ponto`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
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

// Função para login
document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();

    const cpf = document.getElementById('cpf').value;
    const senha = document.getElementById('senha').value;

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cpf, senha })
        });

        if (response.ok) {
            const { token } = await response.json();
            localStorage.setItem('token', token); // Salva o token
            alert('Login bem-sucedido!');
            
            // Atualiza a interface
            document.getElementById('login-section').style.display = 'none';
            document.getElementById('protected-data-section').style.display = 'block';
            document.getElementById('ponto-section').style.display = 'block';
            document.getElementById('btn-logout').style.display = 'inline';

            carregarRegistros(); // Carrega os dados protegidos
        } else {
            alert('CPF ou senha inválidos.');
        }
    } catch (err) {
        console.error('Erro ao fazer login:', err);
        alert('Erro ao conectar ao servidor.');
    }
});

// Funcionalidade de logout
document.getElementById('btn-logout').addEventListener('click', () => {
    logout();
});

function logout() {
    localStorage.removeItem('token'); // Remove o token
    alert('Você saiu com sucesso!');

    // Atualiza a interface
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('protected-data-section').style.display = 'none';
    document.getElementById('ponto-section').style.display = 'none';
    document.getElementById('cadastro-funcionario').style.display = 'none'; // Oculta seção de cadastro
    document.getElementById('btn-logout').style.display = 'none';
}

// Função para gerar relatório
document.getElementById('btn-relatorio').addEventListener('click', async () => {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/relatorio`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
            const relatorio = await response.json();
            console.log(relatorio);
            gerarCSV(relatorio); // Chama a função para gerar o CSV
        } else {
            alert('Erro ao gerar relatório.');
        }
    } catch (err) {
        console.error('Erro:', err);
        alert('Erro ao conectar com o servidor.');
    }
});

// Função para gerar CSV
function gerarCSV(data) {
    const csvRows = [];
    const headers = Object.keys(data[0]);
    csvRows.push(headers.join(',')); // Adiciona cabeçalhos

    for (const registro of data) {
        const values = headers.map(header => JSON.stringify(registro[header], (key, value) => value === null ? '' : value));
        csvRows.push(values.join(','));
    }

    const csvString = csvRows.join('\n');
    downloadCSV(csvString, 'relatorio_pontos.csv');
}

// Função para baixar o arquivo CSV
function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Função para cadastrar funcionário
document.getElementById('form-cadastro-funcionario').addEventListener('submit', async (e) => {
    e.preventDefault();

    const nome = document.getElementById('nome').value;
    const cpf = document.getElementById('cpf-novo').value;
    const senha = document.getElementById('senha-nova').value;
    const cargo = document.getElementById('cargo').value;
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/funcionarios`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ nome, cpf, senha, cargo })
        });

        if (response.ok) {
            alert('Funcionário cadastrado com sucesso!');
            document.getElementById('form-cadastro-funcionario').reset(); // Limpa o formulário
        } else {
            const error = await response.json();
            alert(error.error || 'Erro ao cadastrar funcionário.');
        }
    } catch (err) {
        console.error('Erro ao cadastrar funcionário:', err);
        alert('Erro ao conectar com o servidor.');
    }
});

// Carrega os registros ao inicializar a página
carregarRegistros();