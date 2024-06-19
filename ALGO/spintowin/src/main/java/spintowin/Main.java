package spintowin;

import java.io.IOException;
import java.net.InetSocketAddress;

import com.sun.net.httpserver.HttpServer;

import WebGestion.SalonWebSocketServer; // Assurez-vous d'importer la classe SalonWebSocketServer

public class Main {
    public static void main(String[] args) {
        // Création des threads pour chaque serveur
        Thread httpServerThread = new Thread(() -> {
            try {
                // Lancement du serveur HTTP
                SimpleHttpServer1.main(new String[]{});
            } catch (IOException e) {
                e.printStackTrace();
            }
        });

        Thread h2DatabaseThread = new Thread(() -> {
            // Lancement du serveur H2
            H2Database.main(new String[]{});
        });

        Thread webSocketServerThread = new Thread(() -> {
            // Démarrage du serveur WebSocket
            InetSocketAddress socketAddress = new InetSocketAddress(8888);
            SalonWebSocketServer salonWebSocketServer = new SalonWebSocketServer(socketAddress);
            salonWebSocketServer.start();
        });

        // Démarrage des threads
        httpServerThread.start();
        h2DatabaseThread.start();
        webSocketServerThread.start();

        // Attendez que le serveur HTTP démarre avant d'ajouter le gestionnaire de contexte CORS
        try {
            httpServerThread.join();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

        // Ajout du gestionnaire de contexte CORS au chemin racine du serveur HTTP
        HttpServer server = SimpleHttpServer1.getServer();
        if (server != null) {
            server.createContext("/", new CorsHandler());
        } else {
            System.err.println("HTTP server not initialized. CORS handler not added.");
        }

        // Exemple d'utilisation de la génération de nombre aléatoire
        int randomNumber = RandomNumberUtil.generateRandomNumber();
        System.out.println("Generated random number in main: " + randomNumber);
    }
}
