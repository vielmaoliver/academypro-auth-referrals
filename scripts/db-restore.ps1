param(
  [string]$Container="academypro-postgres",
  [string]$Db="academypro",
  [string]$User="postgres",
  [string]$In="backup_academypro.sql"
)

Get-Content $In | docker exec -i $Container psql -U $User -d $Db
Write-Host "Restore OK <- $In"
