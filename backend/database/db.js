const data = {
    host: '94.62.78.170',
    user: 'nodejs',
    password: 'nodejs',
    database: 'snake'
}

exports.initDbConnection = () => {
    const mysql = require('mysql');
    const db = mysql.createConnection(data);

    db.connect((err) => {
        if (err) throw err;
    });

    return db;
}

/*
DATABASE STRUCTURE

CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(20) UNIQUE NOT NULL,
  `password` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
)
*/