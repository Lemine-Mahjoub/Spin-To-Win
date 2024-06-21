package roulette;


//main's test of Roulette maths
public class Main2 {
	 public static void main(String[] args) {
	        Game game = new Game();
	        Player player1 = new Player("Elio", 1000);
	        game.addPlayer(player1);

	        player1.placeBet(new Bet(20, "3"));
	        player1.placeBet(new Bet(20, "4"));
	        player1.placeBet(new Bet(20, "9"));
	        player1.placeBet(new Bet(50, "red"));
	        player1.placeBet(new Bet("bonus"));
	        game.playRound(4);
	    }
	}