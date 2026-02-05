param(
  [string]$Container="academypro-postgres",
  [string]$Db="academypro",
  [string]$User="postgres",
  [string]$Out="backup_academypro.sql"
)

docker exec -t $Container pg_dump -U $User -d $Db > $Out
Write-Host "Backup OK -> $Out"
