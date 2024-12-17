// server.js
const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(express.json());

const STORAGE_DIRS = {
  LOGS: path.join(__dirname, 'storage', 'logs'),
  BACKUP: path.join(__dirname, 'storage', 'backup'),
};

// Mock user data for demonstration
const MOCK_USERS = [
  { id: '1', email: 'admin@example.com', role: 'admin' },
  { id: '2', email: 'user@example.com', role: 'user' },
];

// Middleware to check if user is admin
const checkAdmin = (req, res, next) => {
  const userId = req.headers['user-id']; // Assume user ID is sent in headers
  const user = MOCK_USERS.find(u => u.id === userId);
  
  if (!user || user.role !== 'admin') {
    return res.status(403).send({ error: 'Access denied' });
  }
  next();
};

// Initialize storage directories
const initializeStorage = async () => {
  await Promise.all(Object.values(STORAGE_DIRS).map(async (dir) => {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      console.error(`Error creating directory ${dir}:`, error);
    }
  }));
};

// Endpoint para salvar um arquivo (apenas admin)
app.post('/api/files', checkAdmin, async (req, res) => {
  const { content, filename } = req.body;
  const filepath = path.join(STORAGE_DIRS.LOGS, filename);
  
  try {
    await fs.writeFile(filepath, content, 'utf-8');
    res.status(201).send({ message: 'File saved successfully' });
  } catch (error) {
    res.status(500).send({ error: 'Failed to save file' });
  }
});

// Endpoint para ler um arquivo (todos os usuários)
app.get('/api/files/:filename', async (req, res) => {
  const { filename } = req.params;
  const filepath = path.join(STORAGE_DIRS.LOGS, filename);
  
  try {
    const content = await fs.readFile(filepath, 'utf-8');
    res.send({ content });
  } catch (error) {
    res.status(404).send({ error: 'File not found' });
  }
});

// Endpoint para deletar um arquivo (apenas admin)
app.delete('/api/files/:filename', checkAdmin, async (req, res) => {
  const { filename } = req.params;
  const filepath = path.join(STORAGE_DIRS.LOGS, filename);
  
  try {
    await fs.unlink(filepath);
    res.send({ message: 'File deleted successfully' });
  } catch (error) {
    res.status(404).send({ error: 'File not found' });
  }
});

// Inicializa os diretórios de armazenamento
initializeStorage();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});