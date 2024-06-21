package roulette;

import java.util.ArrayList;
import java.util.List;
import roulette.Bet;
import roulette.Player;
import roulette.Roulette;
import roulette.Color;

public class Game {
    double bonusAmount = 0;
    public boolean pickBonus = false;
    public int pick = 0;
    private Roulette roulette;
    private List<Player> players;

    public Game() {
        this.roulette = new Roulette();
        this.players = new ArrayList<>();
    }

    // Ajoute un joueur à la liste des joueurs
    public void addPlayer(Player player) {
        players.add(player);
    }

    // Joue un tour avec le numéro de la balle
    public void playRound(int ball) {
        // Affiche les paris des joueurs
        for (Player player : players) {
            for (Bet bet : player.getBets()) {
                if (bet.getTarget().equals("bonus")) {
                    System.out.println(Color.CYAN + player.name + " joue le " + Color.PURPLE + bet.getTarget() + Color.RESET);
                } else {
                    System.out.println(Color.CYAN + player.name + " joue " + Color.YELLOW + bet.getAmount() + Color.CYAN + " sur le " + Color.PURPLE + bet.getTarget() + Color.RESET);
                }
            }
        }

        int winningNumber;
        winningNumber = ball;

        // Affiche le numéro gagnant avec sa couleur correspondante
        if (winningNumber == 0) {
            System.out.println(Color.CYAN + "Numéro tombé: " + Color.GREEN + winningNumber + Color.RESET);
        } else if (Roulette.RED_NUMBERS.contains(winningNumber)) {
            System.out.println(Color.CYAN + "Numéro tombé: " + Color.RED + winningNumber + Color.RESET);
        } else {
            System.out.println(Color.CYAN + "Numéro tombé: " + Color.RESET + winningNumber);
        }

        // Calcule les gains des joueurs
        for (Player player : players) {
            double winnings = 0;
            boolean bonus = false;
            for (Bet bet : player.getBets()) {
                if (bet.getTarget().equals("bonus")) {
                    bonus = true;
                }
                winnings += calculateWinnings(bet, winningNumber);
            }

            // Déduit le bonus si nécessaire
            if (bonus) {
                player.updateCredits(-bonusAmount);
            }

            // Applique le bonus si les conditions sont remplies
            if (pickBonus && bonus) {
                bonusAmount = ((36 / pick) * 0.48) * bonusAmount / 2;
                winnings += bonusAmount;
                System.out.println(Color.CYAN + "Bonus de " + Color.YELLOW + bonusAmount + Color.CYAN + " crédits récupérés!" + Color.RESET);
                pickBonus = false;
                pick = 0;
                bonusAmount = 0;
                bonus = false;
            }

            // Met à jour les crédits du joueur
            player.updateCredits(winnings);
            System.out.println(Color.CYAN + "Crédits: " + Color.YELLOW + player.getCredits() + Color.RESET);
            player.getBets().clear(); // Efface les paris après chaque tour
        }
    }

    // Calcule les gains pour un pari donné et un numéro gagnant
    private int calculateWinnings(Bet bet, int winningNumber) {
        if (Roulette.NUMBERS.contains(bet.getTarget())) {
            pick += 1;
            bonusAmount += bet.getAmount();
            if (Integer.parseInt(bet.getTarget()) == winningNumber) {
                pickBonus = true;
                return 36 * bet.getAmount();
            }
        } else if (winningNumber == 0 && Roulette.SIMPLES.contains(bet.getTarget())) {
            return bet.getAmount() / 2;
        } else if (Roulette.COLORS.contains(bet.getTarget())) {
            if (bet.getTarget().equals("red") && Roulette.RED_NUMBERS.contains(winningNumber)) {
                return 2 * bet.getAmount();
            } else if (bet.getTarget().equals("black") && Roulette.BLACK_NUMBERS.contains(winningNumber)) {
                return 2 * bet.getAmount();
            }
        } else if (Roulette.PARITIES.contains(bet.getTarget())) {
            if (bet.getTarget().equals("even") && winningNumber % 2 == 0) {
                return 2 * bet.getAmount();
            } else if (bet.getTarget().equals("odd") && winningNumber % 2 == 1) {
                return 2 * bet.getAmount();
            }
        } else if (Roulette.RANGES.contains(bet.getTarget())) {
            if (bet.getTarget().equals("low") && winningNumber >= 1 && winningNumber <= 18) {
                return 2 * bet.getAmount();
            } else if (bet.getTarget().equals("high") && winningNumber >= 19) {
                return 2 * bet.getAmount();
            }
        } else if (Roulette.TIERS.contains(bet.getTarget())) {
            if (bet.getTarget().equals("tiers1") && winningNumber >= 1 && winningNumber <= 12) {
                return 3 * bet.getAmount();
            } else if (bet.getTarget().equals("tiers2") && winningNumber >= 13 && winningNumber <= 24) {
                return 3 * bet.getAmount();
            } else if (bet.getTarget().equals("tiers3") && winningNumber >= 25 && winningNumber <= 36) {
                return 3 * bet.getAmount();
            }
        } else if (Roulette.LIGNES.contains(bet.getTarget())) {
            if (bet.getTarget().equals("ligne1") && winningNumber % 3 == 1) {
                return 3 * bet.getAmount();
            } else if (bet.getTarget().equals("ligne2") && winningNumber % 3 == 2) {
                return 3 * bet.getAmount();
            } else if (bet.getTarget().equals("ligne3") && winningNumber % 3 == 0) {
                return 3 * bet.getAmount();
            }
        }
        return 0;
    }
}
