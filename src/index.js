const express = require('express');
const bodyParser = require('body-parser')
const mysql = require('mysql2/promise');

const app = express();

app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('Servidor funcionando!')
});
app.get('/testdb', async (req, res) => {
    try {
        await db.query('SELECT 1'); // Executa uma consulta simples
        res.send('Conexão com o banco de dados funcionando!');
    } catch (err) {
        res.status(500).send('Erro ao conectar ao banco de dados');
    }
});



// Configuração do MySQL
const db = mysql.createPool({
    host: 'localhost',       // Host do banco de dados
    user: 'root',            // Usuário do MySQL
    password: 'Ajunior1!',   // Senha do MySQL
    database: 'ponto_eletronico',
});




const PORT = 8080;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`)
});