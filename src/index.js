// Importações necessárias
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const cors = require('cors'); // Importando o CORS

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
app.use(cors({
    origin: '*', // Permite qualquer origem (ajuste para produção)
}));
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
app.get('/vamos', async (req, res) => {
    const { nome, cpf, senha } = req.body;

    // Verificação de campos obrigatórios
    if (!nome || !cpf || !senha) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    // Validação do CPF
    const validarCPF = (cpf) => {
        cpf = cpf.replace(/\D/g, ''); // Remove caracteres não numéricos
        if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
        let soma = 0, resto;
        for (let i = 1; i <= 9; i++) soma += parseInt(cpf[i - 1]) * (11 - i);
        resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpf[9])) return false;
        soma = 0;
        for (let i = 1; i <= 10; i++) soma += parseInt(cpf[i - 1]) * (12 - i);
        resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        return resto === parseInt(cpf[10]);
    };

    if (!validarCPF(cpf)) {
        return res.status(400).json({ error: 'CPF inválido.' });
    }

    // Validação de senha
    const senhaForte = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!senhaForte.test(senha)) {
        return res.status(400).json({
            error: 'A senha deve conter pelo menos 8 caracteres, incluindo uma letra maiúscula, um número e um caractere especial.',
        });
    }

    try {
        // Hash da senha
        const senhaHash = await bcrypt.hash(senha, 10);

        // Inserção no banco
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

const jwt = require('jsonwebtoken');
const SECRET_KEY = 'sua-chave-secreta-super-segura'; // Use uma variável de ambiente para maior segurança

// Rota de login
app.post('/login', async (req, res) => {
    const { cpf, senha } = req.body;

    if (!cpf || !senha) {
        return res.status(400).json({ error: 'CPF e senha são obrigatórios.' });
    }

    try {
        // Verifica se o usuário existe
        const [rows] = await db.query('SELECT * FROM funcionarios WHERE cpf = ?', [cpf]);

        if (rows.length === 0) {
            return res.status(401).json({ error: 'CPF ou senha inválidos.' });
        }

        const usuario = rows[0];

        // Verifica a senha
        const senhaValida = await bcrypt.compare(senha, usuario.senha);
        if (!senhaValida) {
            return res.status(401).json({ error: 'CPF ou senha inválidos.' });
        }

        // Gera o token JWT
        const token = jwt.sign(
            { id: usuario.id, nome: usuario.nome, cpf: usuario.cpf },
            SECRET_KEY,
            { expiresIn: '1h' } // Token válido por 1 hora
        );

        res.json({ token });
    } catch (err) {
        console.error('Erro ao fazer login:', err);
        res.status(500).json({ error: 'Erro no servidor.' });
    }
});
// Middleware para verificar o token JWT
function autenticarToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token não fornecido.' });
    }

    jwt.verify(token, SECRET_KEY, (err, usuario) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido.' });
        }

        req.usuario = usuario; // Salva os dados do usuário no request
        next();
    });
}
// Exemplo de rota protegida
app.get('/dados-protegidos', autenticarToken, (req, res) => {
    res.json({ message: `Bem-vindo, ${req.usuario.nome}! Seus dados estão protegidos.` });
});
// Rota para gerar relatório de pontos
app.get('/relatorio', autenticarToken, async (req, res) => {
    try {
        const [registros] = await db.query(`
            SELECT p.id, f.nome, p.data_hora, p.tipo 
            FROM pontos p 
            JOIN funcionarios f ON p.funcionario_id = f.id
        `);

        // Retornar os registros em formato JSON
        res.json(registros);
    } catch (err) {
        console.error('Erro ao gerar relatório:', err);
        res.status(500).json({ error: 'Erro ao gerar relatório.' });
    }
});

// Inicializa o servidor
const PORT = 8080;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
