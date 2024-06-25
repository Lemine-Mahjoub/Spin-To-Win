# Définir le chemin du répertoire Maven
$repertoireMaven = ".\ALGO\spintowin"

# Vérifier si le répertoire Maven existe
if (Test-Path $repertoireMaven) {
    # Accéder au répertoire Maven
    Set-Location $repertoireMaven

    # Exécuter les commandes Maven
    mvn clean package
    mvn exec:java
} else {
    Write-Host "Le répertoire $repertoireMaven n'existe pas."
}
