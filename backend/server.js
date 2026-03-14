// backend/server.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// CONFIGURATION MYSQL
// Remplacez 'votre_mot_de_passe' par celui de votre installation macOS
const db = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '', 
    database: 'bravia_hotel_db'
});

db.connect(err => {
    if (err) {
        console.error('Erreur de connexion MySQL. Verifiez que le service est lance (brew services start mysql).', err);
    } else {
        console.log('Connecté à la base de données MySQL Bravia (Hébergement Local)');
    }
});

// --- API ROUTES ---

// Récupérer toutes les entreprises
app.get('/api/companies', (req, res) => {
    db.query('SELECT * FROM companies ORDER BY name ASC', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// Ajouter une entreprise
app.post('/api/companies', (req, res) => {
    const { name } = req.body;
    db.query('INSERT INTO companies (name) VALUES (?)', [name], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json({ id: results.insertId, name });
    });
});

// Récupérer toutes les salles
app.get('/api/rooms', (req, res) => {
    db.query('SELECT * FROM rooms ORDER BY floor ASC, name ASC', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// Ajouter une salle (Contrainte 0-15 gérée par le Frontend et le SQL)
app.post('/api/rooms', (req, res) => {
    const { name, floor } = req.body;
    db.query('INSERT INTO rooms (name, floor) VALUES (?, ?)', [name, floor], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json({ id: results.insertId, name, floor });
    });
});

// Récupérer les événements avec jointures (Entreprise + Salle)
app.get('/api/events', (req, res) => {
    const sql = `
        SELECT e.id, e.event_date, e.company_id, e.room_id, 
               c.name as title, r.name as room, r.floor 
        FROM events e
        JOIN companies c ON e.company_id = c.id
        JOIN rooms r ON e.room_id = r.id
        ORDER BY e.event_date DESC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// Créer un événement (Vérification de collision de salle)
app.post('/api/events', (req, res) => {
    const { company_id, room_id, event_date } = req.body;
    
    // Vérifier si la salle est déjà occupée à cette date
    const checkSql = 'SELECT * FROM events WHERE room_id = ? AND event_date = ?';
    db.query(checkSql, [room_id, event_date], (err, results) => {
        if (results.length > 0) return res.status(400).send("Cette salle est deja reservee.");
        
        const insertSql = 'INSERT INTO events (company_id, room_id, event_date) VALUES (?, ?, ?)';
        db.query(insertSql, [company_id, room_id, event_date], (err, results) => {
            if (err) return res.status(500).json(err);
            res.json({ id: results.insertId });
        });
    });
});

// Supprimer un événement
app.delete('/api/events/:id', (req, res) => {
    db.query('DELETE FROM events WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.sendStatus(200);
    });
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Serveur Bravia Backend tourne sur http://127.0.0.1:${PORT}`);
});