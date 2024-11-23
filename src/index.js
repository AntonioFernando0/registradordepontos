// Importações necessárias
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const cors = require('cors');

// Inicialização do Express
const app = express();

// Configuração do MySQL
const db = mysql.createPool({
    host: 'localhost',       // Host do banco de dados
    user: 'root',            // Usuário do MySQL
    password: 'Ajunior1!',   // Senha do MySQL
    database: 'ponto_eletronico',
});

// Middlewares
app.use(cors()); // Permite requisições de outras origens
app.use(bodyParser.json()); // Interpreta JSON no corpo da requisição

// Verifica a conexão com o banco de dados
db.getConnection()
    .then(() => console.log('Conexão com o banco de dados bem-sucedida!'))
    .catch(err => {
        console.error('Erro ao conectar ao banco de dados:', err);
        process.exit(1); // Encerra o servidor se não conseguir conectar
    });

// Rota inicial de teste
app.get('/', (req, res) => {
    res.send('Servidor funcionando!');
});

// Rota para verificar a conexão com o banco de dados
app.get('/bancodedados', async (req, res) => {
    try {
        await db.query('SELECT 1'); // Executa uma consulta simples
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

// Rota para atualizar um funcionário
app.put('/funcionarios/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, cpf } = req.body;

    if (!nome || !cpf) {
        return res.status(400).json({ error: 'Nome e CPF são obrigatórios.' });
    }

    try {
        const [result] = await db.query(
            'UPDATE funcionarios SET nome = ?, cpf = ? WHERE id = ?',
            [nome, cpf, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Funcionário não encontrado.' });
        }

        res.json({ message: 'Funcionário atualizado com sucesso!' });
    } catch (err) {
        console.error('Erro ao atualizar funcionário:', err);
        res.status(500).json({ error: 'Erro ao atualizar funcionário.' });
    }
});

// Rota para excluir um funcionário
app.delete('/funcionarios/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await db.query('DELETE FROM funcionarios WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Funcionário não encontrado.' });
        }

        res.json({ message: 'Funcionário excluído com sucesso!' });
    } catch (err) {
        console.error('Erro ao excluir funcionário:', err);
        res.status(500).json({ error: 'Erro ao excluir funcionário.' });
    }
});

// Rota para registrar o ponto
app.post('/ponto', async (req, res) => {
    const { funcionario_id, tipo } = req.body;

    if (!funcionario_id || !['entrada', 'saida'].includes(tipo)) {
        return res.status(400).json({ error: 'Funcionário e tipo (entrada ou saída) são obrigatórios.' });
    }

    try {
        await db.query(
            'INSERT INTO pontos (funcionario_id, tipo) VALUES (?, ?)',
            [funcionario_id, tipo]
        );

        res.status(201).json({ message: 'Ponto registrado com sucesso!' });
    } catch (err) {
        console.error('Erro ao registrar ponto:', err);
        res.status(500).json({ error: 'Erro ao registrar ponto.' });
    }
});

// Rota para consultar registros de ponto
app.get('/ponto', async (req, res) => {
    const { funcionario_id } = req.query;

    try {
        let query = `
            SELECT p.id, f.nome, p.data_hora, p.tipo 
            FROM pontos p 
            JOIN funcionarios f ON p.funcionario_id = f.id`;
        const params = [];

        if (funcionario_id) {
            query += ' WHERE p.funcionario_id = ?';
            params.push(funcionario_id);
        }

        const [rows] = await db.query(query, params);

        res.json(rows);
    } catch (err) {
        console.error('Erro ao consultar registros de ponto:', err);
        res.status(500).json({ error: 'Erro ao consultar registros de ponto.' });
    }
});

// Rota para cadastro de funcionários
app.post('/cadastro', async (req, res) => {
    const { nome, cpf, senha } = req.body;

    if (!nome || !cpf || !senha) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
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

// Inicializa o servidor
const PORT = 8080;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

