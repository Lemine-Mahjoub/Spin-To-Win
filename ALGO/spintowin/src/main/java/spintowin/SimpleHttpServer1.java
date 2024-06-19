
package spintowin;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.sun.net.httpserver.Headers;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import roulette.Bet;
import roulette.Game;
import roulette.Player;

import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.*;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
public class SimpleHttpServer1 {
    private static HttpServer server; // Ajout d'un champ statique pour stocker l'instance du serveur

    public static void main(String[] args) throws IOException {
        // Créez le serveur HTTP sur le port 8000
    	 server = HttpServer.create(new InetSocketAddress("0.0.0.0", 8000), 0);

        // Définissez les gestionnaires de requêtes pour les différents chemins 
            server.createContext("/resource2", new Resource2Handler());
            server.createContext("/player", new PlayerHandler());
            server.createContext("/player/name", new PlayerHandlerName());
            server.createContext("/player/new", new PlayerHandlerNew());
            server.createContext("/player/pseudo", new PlayerHandlerAllPseudo());
            server.createContext("/player/mail", new PlayerHandlerAllMail());
            server.createContext("/player/auth", new PlayerHandlerAuth());
            server.createContext("/game/playe", new PlayerPlaye());
            server.createContext("/player/update", new PlayerUpdateCredit());
            server.createContext("/player/evolution/", new StattistiqueJoueur());

        
    server.createContext("/game/ball", new GenerateBallHandler());
 
        // Activez le CORS globalement
        server.setExecutor(null); // Utilisation d'un gestionnaire d'exécution null pour un démarrage par défaut

        // Démarrer le serveur
        server.start();

        System.out.println("Server started on port 8000");
    }

    // Méthode statique pour obtenir l'instance du serveur
    public static HttpServer getServer() {
        return server;
    }
}
class Resource2Handler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String requestPath = exchange.getRequestURI().getPath();
        String[] parts = requestPath.split("/");

        // Check if the request path has the expected format
        if (parts.length != 3 || !parts[1].equals("resource2")) {
            exchange.sendResponseHeaders(404, 0); // Send a 404 response if the path is not correct
            return;
        }

        try {
            // Extract the number from the URL part after /resource2/
            int number = Integer.parseInt(parts[2]);
            
            // Calculate the double of the number
            int result = number * 2;
            
            // Prepare the response
            String response = String.valueOf(result);
            
            // Send the response
            try (OutputStream os = exchange.getResponseBody()) {
                exchange.sendResponseHeaders(200, response.getBytes().length);
                os.write(response.getBytes());
            }
        } catch (NumberFormatException e) {
            // Send a 400 response if the number is not valid
            exchange.sendResponseHeaders(400, 0);
        }
    }
}
class PlayerHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
        // Extracting the ID from the request path
        String requestPath = exchange.getRequestURI().getPath();
        String[] parts = requestPath.split("/");

        // Check if the request path has the expected format
        if (parts.length != 3 || !parts[1].equals("player")) {
            exchange.sendResponseHeaders(404, 0); // Send a 404 response if the path is not correct
            return;
        }

        try {
            // Extract the player ID from the URL part after /player/
            int playerId = Integer.parseInt(parts[2]);
            
            // Call getJoueurById to retrieve player details
            Joueur playerDetails = DatabaseManager.getJoueurById(playerId);
            
            // Check if the player exists
            if (playerDetails != null) {
                // Convert playerDetails to a string representation
                String playerDetailsString = playerDetails.toString();
                
                // Send the player details as response
                byte[] responseBytes = playerDetailsString.getBytes();
                exchange.sendResponseHeaders(200, responseBytes.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(responseBytes);
                }
            } else {
                // Send a 404 response if the player does not exist
                exchange.sendResponseHeaders(404, 0);
            }
        } catch (NumberFormatException e) {
            // Send a 400 response if the ID is not valid
            exchange.sendResponseHeaders(400, 0);
        }
    }}

class PlayerHandlerName implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
        // Extraction du pseudo à partir du chemin de la requête
        String requestPath = exchange.getRequestURI().getPath();
        String[] parts = requestPath.split("/");

        // Vérifier si le chemin de la requête a le format attendu
        if (parts.length != 4 || !parts[1].equals("player") || !parts[2].equals("name")) {
            exchange.sendResponseHeaders(404, 0); // Envoyer une réponse 404 si le chemin n'est pas correct
            return;
        }

        try {
            // Extract the player pseudo from the URL part after /player/name/
            String joueurPseudo = parts[3];
            
            // Appeler getJoueurByName pour récupérer les détails du joueur
            Joueur playerDetails = DatabaseManager.getJoueurByName(joueurPseudo);
            
            // Vérifier si le joueur existe
            if (playerDetails != null) {
                // Convertir playerDetails en une représentation sous forme de chaîne de caractères
                String playerDetailsString = playerDetails.toString();
                
                // Envoyer les détails du joueur en tant que réponse
                byte[] responseBytes = playerDetailsString.getBytes();
                exchange.sendResponseHeaders(200, responseBytes.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(responseBytes);
                }
            } else {
                // Envoyer une réponse 404 si le joueur n'existe pas
                exchange.sendResponseHeaders(404, 0);
            }
        } catch (NumberFormatException e) {
            // Envoyer une réponse 400 si l'ID n'est pas valide
            exchange.sendResponseHeaders(400, 0);
        }
    }
}

class PlayerHandlerNew implements HttpHandler {
	 @Override
	    public void handle(HttpExchange exchange) throws IOException {
	        if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) {
	            Utils.setCorsHeaders(exchange);
	            exchange.sendResponseHeaders(200, -1);
	            return;
	        }

	        Utils.setCorsHeaders(exchange);
	        System.out.println("New player...");

	        try {
	            // Lire le corps de la requête pour obtenir les données du joueur
	            InputStreamReader isr = new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8);
	            BufferedReader br = new BufferedReader(isr);
	            StringBuilder requestBody = new StringBuilder();
	            String line;
	            while ((line = br.readLine()) != null) {
	                requestBody.append(line);
	            }

	            // Convertir le JSON en objet Joueur
	            ObjectMapper objectMapper = new ObjectMapper();
	            Joueur newPlayer = objectMapper.readValue(requestBody.toString(), Joueur.class);

	            // Appeler la fonction pour créer le joueur en base de données
	            DatabaseManager databaseManager = new DatabaseManager();
	            databaseManager.createPlayerFromRequestData(newPlayer);

	            // Envoyer une réponse 201 (Created) avec les données du joueur ajouté
	            exchange.getResponseHeaders().set("Content-Type", "application/json");
	            exchange.sendResponseHeaders(201, 0);

	            // Sérialiser l'objet joueur en JSON
	            String jsonResponse = objectMapper.writeValueAsString(newPlayer);

	            // Envoyer les données du joueur dans le corps de la réponse
	            try (OutputStream os = exchange.getResponseBody()) {
	                os.write(jsonResponse.getBytes(StandardCharsets.UTF_8));
	            }
	        } catch (Exception e) {
	            // En cas d'erreur, envoyer une réponse 500 (Internal Server Error)
	            exchange.sendResponseHeaders(500, 0);
	        } finally {
	            exchange.close(); // Fermez l'échange après avoir envoyé la réponse
	        }
	    }

	    static class Utils {
	        public static void setCorsHeaders(HttpExchange exchange) {
	            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
	            exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
	            exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");
	        }
	    }
	}
    class PlayerHandlerAllPseudo implements HttpHandler {
    	@Override
	    public void handle(HttpExchange exchange) throws IOException {
	        if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) {
	            Utils.setCorsHeaders(exchange);
	            exchange.sendResponseHeaders(200, -1);
	            return;
	        }

	        Utils.setCorsHeaders(exchange);
	        System.out.println("All player...");


            try {
                // Appeler getAllPseudo pour récupérer la liste des pseudonymes
                List<String> playerPseudos = DatabaseManager.getAllPseudo();

                // Convertir la liste de pseudonymes en JSON
                ObjectMapper objectMapper = new ObjectMapper();
                ArrayNode pseudoArray = objectMapper.createArrayNode();
                for (String pseudo : playerPseudos) {
                    pseudoArray.add(pseudo);
                }
                String jsonResponse = objectMapper.writeValueAsString(pseudoArray);

                // Envoyer les pseudonymes en tant que réponse JSON
                byte[] responseBytes = jsonResponse.getBytes();
                exchange.getResponseHeaders().set("Content-Type", "application/json");
                exchange.sendResponseHeaders(200, responseBytes.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(responseBytes);
                }
            } catch (NumberFormatException e) {
                // Envoyer une réponse 400 si l'ID n'est pas valide
                exchange.sendResponseHeaders(400, 0);
            }
        }
        static class Utils {
	        public static void setCorsHeaders(HttpExchange exchange) {
	            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
	            exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
	            exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");
	        }
	    }
        }
        
        class PlayerHandlerAuth implements HttpHandler {
        	@Override
        	public void handle(HttpExchange exchange) throws IOException {
        	    if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) {
        	        Utils.setCorsHeaders(exchange);
        	        exchange.sendResponseHeaders(200, -1);
        	        return;
        	    }
        	    Utils.setCorsHeaders(exchange);
        	    System.out.println("Authenticating player...");


                // Récupérer les données du corps de la requête
                InputStream requestBody = exchange.getRequestBody();
                BufferedReader reader = new BufferedReader(new InputStreamReader(requestBody));
                StringBuilder requestBodyBuilder = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    requestBodyBuilder.append(line);
                }
                String requestBodyString = requestBodyBuilder.toString();

                // Analyser les données JSON du corps de la requête
                ObjectMapper objectMapper = new ObjectMapper();
                JsonNode requestBodyJson = objectMapper.readTree(requestBodyString);
                String pseudo = requestBodyJson.get("pseudo").asText();
                String motDePasse = requestBodyJson.get("motDePasse").asText();

                // Vérifier l'authenticité du joueur dans la base de données
                Joueur isAuthenticated = DatabaseManager.verifieMotDePasse(pseudo, motDePasse);

                if (isAuthenticated != null) {
                	ObjectMapper objectMapper1 = new ObjectMapper();
                	String jsonResponse = objectMapper1.writeValueAsString(isAuthenticated);

                	// Envoyer la réponse
                	exchange.getResponseHeaders().set("Content-Type", "application/json");
                	byte[] responseBytes = jsonResponse.getBytes(StandardCharsets.UTF_8);
                	exchange.sendResponseHeaders(200, responseBytes.length);
                	try (OutputStream os = exchange.getResponseBody()) {
                	    os.write(responseBytes);
                	}
                } else {
                    // Renvoyer une réponse d'erreur si l'authentification échoue
                    String jsonResponse = "{\"message\": \"Authentication failed. Invalid pseudo or motDePasse.\"}";

                    // Envoyer la réponse
                    exchange.getResponseHeaders().set("Content-Type", "application/json");
                    exchange.sendResponseHeaders(401, jsonResponse.getBytes().length);
                    try (OutputStream os = exchange.getResponseBody()) {
                        os.write(jsonResponse.getBytes());
                    }
                
            }
        }
        
            
            static class Utils {
                public static void setCorsHeaders(HttpExchange exchange) {
                    exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
                    exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
                    exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");
                }
            }

 
        }
            class PlayerUpdateCredit implements HttpHandler {
                @Override
                public void handle(HttpExchange exchange) throws IOException {
                    if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) {
                        Utils.setCorsHeaders(exchange);
                        exchange.sendResponseHeaders(200, -1);
                        return;
                    }
                    Utils.setCorsHeaders(exchange);
                    System.out.println("Updating player credit...");

                    // Récupérer les données du corps de la requête
                    InputStream requestBody = exchange.getRequestBody();
                    BufferedReader reader = new BufferedReader(new InputStreamReader(requestBody));
                    StringBuilder requestBodyBuilder = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        requestBodyBuilder.append(line);
                    }
                    String requestBodyString = requestBodyBuilder.toString();

                    // Analyser les données JSON du corps de la requête
                    ObjectMapper objectMapper = new ObjectMapper();
                    JsonNode requestBodyJson = objectMapper.readTree(requestBodyString);
                    String pseudo = requestBodyJson.get("pseudo").asText();
                    int credit = requestBodyJson.get("credit").asInt(); // Utilisez asInt() pour récupérer un entier

                    // Mettre à jour le crédit du joueur dans la base de données
                    Joueur updatedPlayer = DatabaseManager.updateCredit(pseudo, credit);

                    // Vérifier si la mise à jour a réussi
                    if (updatedPlayer != null) {
                        // Convertir le joueur mis à jour en JSON
                        String jsonResponse = objectMapper.writeValueAsString(updatedPlayer);

                        // Envoyer la réponse
                        exchange.getResponseHeaders().set("Content-Type", "application/json");
                        byte[] responseBytes = jsonResponse.getBytes(StandardCharsets.UTF_8);
                        exchange.sendResponseHeaders(200, responseBytes.length);
                        try (OutputStream os = exchange.getResponseBody()) {
                            os.write(responseBytes);
                        }
                    } else {
                        // Renvoyer une réponse d'erreur si la mise à jour a échoué
                        String jsonResponse = "{\"message\": \"Failed to update player credit.\"}";

                        // Envoyer la réponse
                        exchange.getResponseHeaders().set("Content-Type", "application/json");
                        exchange.sendResponseHeaders(400, jsonResponse.getBytes().length);
                        try (OutputStream os = exchange.getResponseBody()) {
                            os.write(jsonResponse.getBytes());
                        }
                    }
                }
                static class Utils {
                    public static void setCorsHeaders(HttpExchange exchange) {
                        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
                        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
                        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");
                    }
                }
            }
            class PlayerPlaye implements HttpHandler {

                @Override
                public void handle(HttpExchange exchange) throws IOException {
                	if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) {
                        Utils.setCorsHeaders(exchange);
                        exchange.sendResponseHeaders(200, -1);
                        return;
                    }
                    Utils.setCorsHeaders(exchange);
                    System.out.println("Play game");

                    // Lire les données du corps de la requête
                    InputStream requestBody = exchange.getRequestBody();
                    ObjectMapper objectMapper = new ObjectMapper();
                    JsonNode jsonNode = objectMapper.readTree(requestBody);

                    // Extraire les informations du JSON
                    String playerName = jsonNode.get("name").asText();
                    int playerCredits = jsonNode.get("credits").asInt();
                    int ballNumber = jsonNode.get("ballNumber").asInt();
                    List<Bet> bets = new ArrayList<>();
                    JsonNode betsNode = jsonNode.get("bets");
                    boolean hasBonusBet = false;

                    if (betsNode.isArray()) {
                        for (JsonNode betNode : betsNode) {
                            String betType = betNode.get("betType").asText();
                            if (betType.equals("bonus")) {
                                hasBonusBet = true;
                            } else {
                                int amount = betNode.get("amount").asInt();
                                Bet bet = new Bet(amount, betType);
                                bets.add(bet);
                            }
                        }
                    }

                    // Créer un jeu et un joueur avec les crédits initiaux
                    Game game = new Game();
                    Player player = new Player(playerName, playerCredits);
                    System.out.println("Player name: " + player.name);
                    System.out.println("Player credits: " + player.getCredits());
                    game.addPlayer(player);

                    // Placer les paris
                    for (Bet bet : bets) {
                        player.placeBet(bet);
                    }

                    // Handle the bonus bet if present
                    if (hasBonusBet) {
                        player.placeBet(new Bet("bonus"));
                    }

                    // Simulate the round with the ball number
                    game.playRound(ballNumber);

                    // Récupérer le joueur mis à jour par son nom
                    Joueur updatedJoueur = DatabaseManager.getJoueurByName(playerName);
                    if (updatedJoueur == null) {
                        String response = "Player not found!";
                        exchange.sendResponseHeaders(404, response.getBytes().length);
                        OutputStream outputStream = exchange.getResponseBody();
                        outputStream.write(response.getBytes());
                        outputStream.close();
                        return;
                    }

                    // Comparer les crédits initiaux et les crédits mis à jour
                    float initialCredits = playerCredits;
                    float updatedCredits = updatedJoueur.getCredit();
                    if (updatedCredits == 0) {
                        // Faites quelque chose si updatedCredits est égal à 0
                        updatedCredits = 100;
                    }
                    double difference = Math.abs((double) (updatedCredits - initialCredits) / initialCredits);

                    // Modifier la condition pour vérifier une différence de 25 %
                    if (difference > 0.25) {
                        // Appeler updateEvolutionCredit avec l'id du joueur et les crédits actuels après la mise à jour
                        System.out.println("TABLE2...");
                        DatabaseManager.updateEvolutionCredit(updatedJoueur.getId(), updatedCredits);
                    }

                    // Préparer la réponse JSON avec les informations mises à jour du joueur
                    String response = objectMapper.writeValueAsString(updatedJoueur);
                    exchange.sendResponseHeaders(200, response.getBytes().length);
                    OutputStream outputStream = exchange.getResponseBody();
                    outputStream.write(response.getBytes());
                    outputStream.close();
                }

                static class Utils {
                    public static void setCorsHeaders(HttpExchange exchange) {
                        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
                        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
                        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");
                    }
                }
            }

            
            class StattistiqueJoueur implements HttpHandler {
                @Override
                public void handle(HttpExchange exchange) throws IOException {
                    if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) {
                        Utils.setCorsHeaders(exchange);
                        exchange.sendResponseHeaders(200, -1);
                        return;
                    }
                    Utils.setCorsHeaders(exchange);
                    System.out.println("All evolution");

                    // Lire l'ID du joueur à partir du chemin de l'URL
                    String path = exchange.getRequestURI().getPath();
                    String[] pathParts = path.split("/");
                    if (pathParts.length != 4) {
                        String response = "ID du joueur est requis dans l'URL!";
                        exchange.sendResponseHeaders(400, response.getBytes().length);
                        try (OutputStream os = exchange.getResponseBody()) {
                            os.write(response.getBytes());
                        }
                        return;
                    }

                    int joueurId;
                    try {
                        joueurId = Integer.parseInt(pathParts[3]);
                    } catch (NumberFormatException e) {
                        String response = "ID du joueur invalide!";
                        exchange.sendResponseHeaders(400, response.getBytes().length);
                        try (OutputStream os = exchange.getResponseBody()) {
                            os.write(response.getBytes());
                        }
                        return;
                    }

                    // Récupérer le joueur par son ID
                    Joueur joueur = DatabaseManager.getJoueurById(joueurId);
                    if (joueur == null) {
                        String response = "Joueur non trouvé!";
                        exchange.sendResponseHeaders(404, response.getBytes().length);
                        try (OutputStream os = exchange.getResponseBody()) {
                            os.write(response.getBytes());
                        }
                        return;
                    }

                    // Récupérer l'évolution des crédits du joueur
                    List<Float> credits = DatabaseManager.getAllEvolutionCredit(joueur.getId());

                    // Convertir la liste en JSON
                    ObjectMapper objectMapper = new ObjectMapper();
                    String jsonResponse = objectMapper.writeValueAsString(credits);

                    // Envoyer la réponse JSON
                    byte[] responseBytes = jsonResponse.getBytes();
                    exchange.getResponseHeaders().set("Content-Type", "application/json");
                    exchange.sendResponseHeaders(200, responseBytes.length);
                    try (OutputStream os = exchange.getResponseBody()) {
                        os.write(responseBytes);
                    }
                }

                static class Utils {
                    public static void setCorsHeaders(HttpExchange exchange) {
                        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
                        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
                        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");
                    }
                }
            }
            
            
            class GenerateBallHandler implements HttpHandler {
            @Override
            public void handle(HttpExchange exchange) throws IOException {
                if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) {
        	        Utils.setCorsHeaders(exchange);
        	        exchange.sendResponseHeaders(200, -1);
        	        return;
                }
                Utils.setCorsHeaders(exchange);
        	    System.out.println("Ball generate");
                
                // Générer un nombre aléatoire entre 0 et 36
                Random random = new Random();
                int randomNumber = random.nextInt(37); // 0 inclus, 37 exclu

                // Convertir le nombre en JSON
                ObjectMapper objectMapper = new ObjectMapper();
                String jsonResponse = objectMapper.writeValueAsString(randomNumber);

                // Envoyer le nombre aléatoire en tant que réponse JSON
                byte[] responseBytes = jsonResponse.getBytes();
                exchange.getResponseHeaders().set("Content-Type", "application/json");
                exchange.sendResponseHeaders(200, responseBytes.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(responseBytes);
                }
            }
            static class Utils {
                public static void setCorsHeaders(HttpExchange exchange) {
                    exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
                    exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
                    exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");
                }
            }
            }

            class PlayerHandlerAllMail implements HttpHandler {
            	@Override
        	    public void handle(HttpExchange exchange) throws IOException {
        	        if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) {
        	            Utils.setCorsHeaders(exchange);
        	            exchange.sendResponseHeaders(200, -1);
        	            return;
        	        }

        	        Utils.setCorsHeaders(exchange);
        	        System.out.println("All player...");


                    try {
                        // Appeler getAllPseudo pour récupérer la liste des pseudonymes
                        List<String> playerPseudos = DatabaseManager.getAllPseudo();

                        // Convertir la liste de pseudonymes en JSON
                        ObjectMapper objectMapper = new ObjectMapper();
                        ArrayNode pseudoArray = objectMapper.createArrayNode();
                        for (String pseudo : playerPseudos) {
                            pseudoArray.add(pseudo);
                        }
                        String jsonResponse = objectMapper.writeValueAsString(pseudoArray);

                        // Envoyer les pseudonymes en tant que réponse JSON
                        byte[] responseBytes = jsonResponse.getBytes();
                        exchange.getResponseHeaders().set("Content-Type", "application/json");
                        exchange.sendResponseHeaders(200, responseBytes.length);
                        try (OutputStream os = exchange.getResponseBody()) {
                            os.write(responseBytes);
                        }
                    } catch (NumberFormatException e) {
                        // Envoyer une réponse 400 si l'ID n'est pas valide
                        exchange.sendResponseHeaders(400, 0);
                    }
                }
                static class Utils {
        	        public static void setCorsHeaders(HttpExchange exchange) {
        	            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        	            exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        	            exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        	        }
        	    }
                }