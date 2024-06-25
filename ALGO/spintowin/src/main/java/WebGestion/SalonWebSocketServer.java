package WebGestion;

import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;
import spintowin.RandomNumber;

import java.net.InetSocketAddress;
import java.util.ArrayList;
import java.util.List;
import java.util.Timer;
import java.util.TimerTask;

public class SalonWebSocketServer extends WebSocketServer {
    private List<Salon> salons;
    private int etatPartie;

    // Constructeur pour initialiser le serveur WebSocket et le timer pour changer l'état du jeu
    public SalonWebSocketServer(InetSocketAddress address) {
        super(address);
        this.salons = new ArrayList<>();
        this.etatPartie = 1;

        // Timer pour changer l'état du jeu toutes les 25 secondes
        Timer etatTimer = new Timer();
        etatTimer.scheduleAtFixedRate(new TimerTask() {
            @Override
            public void run() {
                changerEtatPartie();
            }
        }, 0, 25000); // 25 secondes
    }

    // Méthode pour changer l'état de la partie
    private void changerEtatPartie() {
        if (etatPartie == 1) {
            etatPartie = 2;
            System.out.println("Etat de la partie changé à 2");
            generateAndSendNumbers();

            // Revenir à l'état 1 après 8 secondes
            new Timer().schedule(new TimerTask() {
                @Override
                public void run() {
                    etatPartie = 1;
                    System.out.println("Etat de la partie changé à 1");
                    envoyerEtatPartie();
                }
            }, 8000); // 8 secondes
        }
    }

    // Générer un nombre aléatoire pour chaque salon et l'envoyer aux clients
    private void generateAndSendNumbers() {
        for (Salon salon : salons) {
            int randomNum = RandomNumber.generateNumber();
            System.out.println("Nouveau numéro de salon généré pour le salon " + salon.getNumero() + " : " + randomNum);

            // Créer une chaîne JSON pour envoyer les données aux clients
            String salonData = "{\"NbAlea\": " + randomNum + ", \"salonId\": " + salon.getNumero() + ", \"etatPartie\": " + etatPartie + ", \"nbJoueur\": " + salon.nombreJoueurDansSalon() + "}";
            salon.broadcast(salonData);
        }
    }

    // Envoyer l'état de la partie à tous les salons
    private void envoyerEtatPartie() {
        for (Salon salon : salons) {
            int salonId = salon.getNumero();
            String data = "{\"salonId\": " + salonId + ", \"etatPartie\": " + etatPartie + ", \"nbJoueur\": " + salon.nombreJoueurDansSalon() + "}";
            salon.broadcast(data);
        }
    }

    @Override
    public void onStart() {
        System.out.println("Serveur WebSocket démarré sur le port: " + getPort());
    }

    @Override
    public void onOpen(WebSocket conn, ClientHandshake handshake) {
        System.out.println("Nouvelle connexion de: " + conn.getRemoteSocketAddress());

        // Trouver un salon disponible ou en créer un nouveau
        Salon salonDisponible = trouverSalonDisponible();
        if (salonDisponible == null) {
            salonDisponible = creerNouveauSalon();
        }

        // Ajouter le joueur au salon et envoyer le numéro du salon
        boolean ajoutReussi = salonDisponible.ajouterJoueur(conn);
        if (ajoutReussi) {
            System.out.println("Joueur ajouté au salon numéro " + salonDisponible.getNumero());
            envoyerNumeroSalon(conn, salonDisponible.getNumero());
        } else {
            System.out.println("Le salon est plein.");
        }
    }

    // Trouver un salon avec moins de 5 joueurs
    private Salon trouverSalonDisponible() {
        for (Salon salon : salons) {
            if (salon.getJoueurs().size() < 5) { // Limite de 5 joueurs par salon
                return salon;
            }
        }
        return null;
    }

    // Créer un nouveau salon et l'ajouter à la liste des salons
    private Salon creerNouveauSalon() {
        Salon nouveauSalon = new Salon();
        salons.add(nouveauSalon);
        return nouveauSalon;
    }

    // Envoyer le numéro de salon au client
    private void envoyerNumeroSalon(WebSocket conn, int numeroSalon) {
        conn.send("Vous êtes dans le salon numéro " + numeroSalon);
    }

    @Override
    public void onClose(WebSocket conn, int code, String reason, boolean remote) {
        System.out.println("Connexion fermée par " + (remote ? "le client" : "le serveur") + ": " + reason);

        // Retirer le joueur de tous les salons
        for (Salon salon : salons) {
            salon.retirerJoueur(conn);
        }
    }

    @Override
    public void onMessage(WebSocket conn, String message) {
        System.out.println("Message reçu: " + message);

        // Ajouter le message au chat et le diffuser aux autres joueurs du salon
        for (Salon salon : salons) {
            if (salon.getJoueurs().contains(conn)) {
                Salon.addChatMessage(message); // Ajouter le message au chatMessages partagé
                salon.broadcast(message);
                break;
            }
        }
    }

    @Override
    public void onError(WebSocket conn, Exception ex) {
        ex.printStackTrace();
    }

    public static void main(String[] args) {
    	 InetSocketAddress socketAddress = new InetSocketAddress("0.0.0.0",8888);
        SalonWebSocketServer server = new SalonWebSocketServer(socketAddress);
        server.start();
    }
}
