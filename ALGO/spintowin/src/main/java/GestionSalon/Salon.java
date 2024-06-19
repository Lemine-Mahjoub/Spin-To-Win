package GestionSalon;

import spintowin.Joueur;

public class Salon {
	private int identifiantSalon;
	private Joueur[] joueurs = new Joueur[10]; // Corrected the declaration of the Joueur array
	private int nbJoueurEnLigne;
	
	
	
	public Salon(int identifiantSalon, Joueur[] joueurs, int nbJoueurEnLigne) {
		super();
		this.identifiantSalon = identifiantSalon;
		this.joueurs = joueurs;
		this.nbJoueurEnLigne = nbJoueurEnLigne;
	}
	
	
	public int getIdentifiantSalon() {
		return identifiantSalon;
	}
	public void setIdentifiantSalon(int identifiantSalon) {
		this.identifiantSalon = identifiantSalon;
	}
	public Joueur[] getJoueurs() {
		return joueurs;
	}
	public void setJoueurs(Joueur[] joueurs) {
		this.joueurs = joueurs;
	}
	public int getNbJoueurEnLigne() {
		return nbJoueurEnLigne;
	}
	public void setNbJoueurEnLigne(int nbJoueurEnLigne) {
		this.nbJoueurEnLigne = nbJoueurEnLigne;
	}
	
	
}
