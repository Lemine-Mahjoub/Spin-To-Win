# Définir le chemin du répertoire Angular
$repertoireAngular = ".\IHM\SpinToWinAngular"

# Vérifier si le répertoire Angular existe
if (Test-Path $repertoireAngular) {
    # Accéder au répertoire Angular
    Set-Location $repertoireAngular

    # Exécuter la commande ng serve
    ng serve
} else {
    Write-Host "Le répertoire $repertoireAngular n'existe pas."
}
