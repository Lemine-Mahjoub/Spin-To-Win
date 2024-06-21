package roulette;

import java.util.ArrayList;
import java.util.List;

public class Player {

    public String name;
    private double credits; // Player's credits
    private List<Bet> bets; // List of bets placed by the player

    public Player(String name, double initialCredits) {
        this.name = name;
        this.credits = initialCredits;
        this.bets = new ArrayList<>();
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    // Method to place a bet if the player has enough credits
    public void placeBet(Bet bet) {
        if (bet.getAmount() <= credits) {
            bets.add(bet); // Add the bet to the list
            credits -= bet.getAmount(); // Deduct the bet amount from credits
        } else {
            System.out.println("Not enough credits to place this bet.");
        }
    }

    // Method to update the player's credits by a certain amount
    public void updateCredits(double amount) {
        credits += amount;
    }

    // Getter for the list of bets placed by the player
    public List<Bet> getBets() {
        return bets;
    }

    // Getter for the player's credits
    public double getCredits() {
        return credits;
    }
}
