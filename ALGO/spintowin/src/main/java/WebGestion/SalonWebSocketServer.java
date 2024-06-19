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

    public SalonWebSocketServer(InetSocketAddress address) {
        super(address);
        this.salons = new ArrayList<>();
        this.etatPartie = 1;

        Timer etatTimer = new Timer();
        etatTimer.scheduleAtFixedRate(new TimerTask() {
            @Override
            public void run() {
                changerEtatPartie();
            }
        }, 0, 25000); // 30 secondes
    }

    private void changerEtatPartie() {
        if (etatPartie == 1) {
            etatPartie = 2;
            System.out.println("Etat de la partie changé à 2");
            generateAndSendNumbers();
            new Timer().schedule(new TimerTask() {
                @Override
                public void run() {
                    etatPartie = 1;
                    System.out.println("Etat de la partie changé à 1");
                    envoyerEtatPartie();
                }
            }, 8000); // 15 secondes
        }
    }

    private void generateAndSendNumbers() {
        for (Salon salon : salons) {
            int randomNum = RandomNumber.generateNumber();
            System.out.println("Nouveau numéro de salon généré pour le salon " + salon.getNumero() + " : " + randomNum);

            String salonData = "{\"NbAlea\": " + randomNum + ", \"salonId\": " + salon.getNumero() + ", \"etatPartie\": " + etatPartie + "}";
            salon.broadcast(salonData);
        }
    }

    private void envoyerEtatPartie() {
        String etatData = "{\"etatPartie\": " + etatPartie + "}";
        for (Salon salon : salons) {
            int salonId = salon.getNumero();
            String data = "{\"salonId\": " + salonId + ", \"etatPartie\": " + etatPartie + "}";
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

        Salon salonDisponible = trouverSalonDisponible();
        if (salonDisponible == null) {
            salonDisponible = creerNouveauSalon();
        }

        boolean ajoutReussi = salonDisponible.ajouterJoueur(conn);
        if (ajoutReussi) {
            System.out.println("Joueur ajouté au salon numéro " + salonDisponible.getNumero());
            envoyerNumeroSalon(conn, salonDisponible.getNumero());
        } else {
            System.out.println("Le salon est plein.");
        }
    }

    private Salon trouverSalonDisponible() {
        for (Salon salon : salons) {
            if (salon.getJoueurs().size() < 10) {
                return salon;
            }
        }
        return null;
    }

    private Salon creerNouveauSalon() {
        Salon nouveauSalon = new Salon();
        salons.add(nouveauSalon);
        return nouveauSalon;
    }

    private void envoyerNumeroSalon(WebSocket conn, int numeroSalon) {
        conn.send("Vous êtes dans le salon numéro " + numeroSalon);
    }

    @Override
    public void onClose(WebSocket conn, int code, String reason, boolean remote) {
        System.out.println("Connexion fermée par " + (remote ? "le client" : "le serveur") + ": " + reason);

        for (Salon salon : salons) {
            salon.retirerJoueur(conn);
        }
    }

    @Override
    public void onMessage(WebSocket conn, String message) {
        System.out.println("Message reçu: " + message);
        // Handle the message as a chat message
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
 
        InetSocketAddress socketAddress = new InetSocketAddress(8888);
        SalonWebSocketServer server = new SalonWebSocketServer(socketAddress); // Utiliser le port 8888
 
        server.start();
    }
}
