package roulette;

// The Bet class represents a bet placed in the roulette game
public class Bet {
    private int amount; // The amount of the bet
    private String target; // The target of the bet (e.g., a number, color, etc.)

    public Bet(int amount, String target) {
        this.amount = amount;
        this.target = target;
    }

    // Constructor initializes the bet with a target and a default amount of 0 use for the bonus
    public Bet(String target) {
        this(0, target);
    }

    public int getAmount() {
        return amount;
    }

    public String getTarget() {
        return target;
    }
}
