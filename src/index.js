// Importações necessárias
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const jwt = require('jsonwebtoken');

// Inicialização do Express
const app = express();

// Configuração do MySQL
const db = mysql.createPool({
    host: 'localhost',       // Host do banco de dados
    user: 'root',            // Usuário do MySQL
    password: 'Ajunior1!',   // Senha do MySQL (altere conforme necessário)
    database: 'ponto_eletronico', // Nome do banco de dados
});

// Middlewares
app.use(cors({
    origin: '*', // Permite qualquer origem
}));
app.use(bodyParser.json()); // Interpreta JSON no corpo da requisição

// Verifica a conexão com o banco de dados
db.getConnection()
    .then(() => console.log('Conexão com o banco de dados bem-sucedida!'))
    .catch(err => {
        console.error('Erro ao conectar ao banco de dados:', err);
        process.exit(1);
    });

// Rota inicial de teste
app.get('/', (req, res) => {
    res.send('Servidor funcionando!');
});

// Rota para verificar a conexão com o banco de dados
app.get('/bancodedados', async (req, res) => {
    try {
        await db.query('SELECT 1');
        res.send('Conexão com o banco de dados funcionando!');
    } catch (err) {
        console.error('Erro ao verificar o banco de dados:', err);
        res.status(500).send('Erro ao conectar ao banco de dados.');
    }
});

// Rota para listar todos os funcionários
app.get('/funcionarios', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, nome, cpf FROM funcionarios');
        res.json(rows);
    } catch (err) {
        console.error('Erro ao listar funcionários:', err);
        res.status(500).json({ error: 'Erro ao listar funcionários.' });
    }
});

// Rota para cadastrar funcionários
app.post('/funcionarios', async (req, res) => {
    const { nome, cpf, senha } = req.body;

    if (!nome || !cpf || !senha) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    const validarCPF = (cpf) => {
        cpf = cpf.replace(/\D/g, '');
        if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
        let soma = 0, resto;
        for (let i = 1; i <= 9; i++) soma += parseInt(cpf[i - 1]) * (11 - i);
        resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpf[9])) return false;
        soma = 0;
        for (let i = 1; i <= 10; i++) soma += parseInt(cpf[i - 1]) * (12 - i);
        resto = (soma * 10) % 11;
        return resto === parseInt(cpf[10]);
    };

    if (!validarCPF(cpf)) {
        return res.status(400).json({ error: 'CPF inválido.' });
    }

    const senhaForte = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!senhaForte.test(senha)) {
        return res.status(400).json({
            error: 'A senha deve conter pelo menos 8 caracteres, incluindo uma letra maiúscula, um número e um caractere especial.',
        });
    }

    try {
        const senhaHash = await bcrypt.hash(senha, 10);
        await db.query(
            'INSERT INTO funcionarios (nome, cpf, senha) VALUES (?, ?, ?)',
            [nome, cpf, senhaHash]
        );
        res.status(201).json({ message: 'Funcionário cadastrado com sucesso!' });
    } catch (err) {
        console.error('Erro ao cadastrar funcionário:', err);
        res.status(500).json({ error: 'Erro ao cadastrar funcionário.' });
    }
});

// Rota para registrar ponto
app.post('/ponto', async (req, res) => {
    const { funcionario_id, tipo } = req.body;

    if (!funcionario_id || !['entrada', 'saida'].includes(tipo)) {
        return res.status(400).json({ error: 'Funcionário e tipo (entrada ou saída) são obrigatórios.' });
    }

    const data_hora = new Date();
    try {
        await db.query(
            'INSERT INTO pontos (funcionario_id, tipo, data_hora) VALUES (?, ?, ?)',
            [funcionario_id, tipo, data_hora]
        );
        res.status(201).json({ message: 'Ponto registrado com sucesso!', data_hora });
    } catch (err) {
        console.error('Erro ao registrar ponto:', err);
        res.status(500).json({ error: 'Erro ao registrar ponto.' });
    }
});

// Rota para gerar relatório
app.get('/relatorio', async (req, res) => {
    const { funcionario_id, dia, mes, ano } = req.query;

    let query = `
        SELECT p.id, f.nome, p.tipo, p.data_hora
        FROM pontos p
        JOIN funcionarios f ON p.funcionario_id = f.id
        WHERE 1=1`;
    const params = [];

    if (funcionario_id) {
        query += ' AND p.funcionario_id = ?';
        params.push(funcionario_id);
    }

    if (ano) {
        query += ' AND YEAR(p.data_hora) = ?';
        params.push(ano);
    }

    if (mes) {
        query += ' AND MONTH(p.data_hora) = ?';
        params.push(mes);
    }

    if (dia) {
        query += ' AND DAY(p.data_hora) = ?';
        params.push(dia);
    }

    try {
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error('Erro ao gerar relatório:', err);
        res.status(500).json({ error: 'Erro ao gerar relatório.' });
    }
});

// Inicialização do servidor
const PORT = 8080;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
