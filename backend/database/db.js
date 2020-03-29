const data = {
    host: '94.62.78.170',
    user: 'nodejs',
    password: 'nodejs',
    database: 'bored'
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
);

CREATE TABLE `posts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user` varchar(20) NOT NULL,
  `created_at` int(11) NOT NULL,
  `type` set('text','image','video') NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user`) REFERENCES `users` (`username`)
);

CREATE TABLE `text_posts` (
  `id` int(11) NOT NULL,
  `text` text NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`id`) REFERENCES `posts` (`id`)
);

CREATE TABLE `image_posts` (
  `id` int(11) NOT NULL,
  `path` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`id`) REFERENCES `posts` (`id`)
);

CREATE TABLE `video_posts` (
  `id` int(11) NOT NULL,
  `path` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`id`) REFERENCES `posts` (`id`)
);

CREATE TABLE `reactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `post` int(11) NOT NULL,
  `user` varchar(20) NOT NULL,
  `reaction` set('amazing','good','meh','bad') NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`post`) REFERENCES `posts` (`id`),
  FOREIGN KEY (`user`) REFERENCES `users` (`username`)
);

CREATE TABLE `comments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `post` int(11) NOT NULL,
  `user` varchar(20) NOT NULL,
  `comment` text NOT NULL,
  `created_at` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`post`) REFERENCES `posts` (`id`),
  FOREIGN KEY (`user`) REFERENCES `users` (`username`)
);

*/